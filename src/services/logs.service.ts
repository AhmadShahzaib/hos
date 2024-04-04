import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MessagePatternResponseType } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { mapMessagePatternResponseToException } from '@shafiqrathore/logeld-tenantbackend-common-future';
import {
  EventType,
  LogActionType,
  MSToTimeReturnType,
  StatusKey,
} from 'logs/Enums';
import { HOSStatusInMemoryCalculatedStats } from 'logs/HOSStatusInMemoryCalculatedStats';
import { getTimeZoneDateRangeForDay } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { OffDuty } from 'logs/OffDuty';
import { OnBreak } from 'logs/OnBreak';
import { OnDriving } from 'logs/OnDriving';
import { OnDuty } from 'logs/OnDuty';
import { EldEvents } from 'logs/EldEvents';
import { PersonalConveyance } from 'logs/PersonalConveyance';
import { LogEntry, LogsDocumentContentsType } from 'logs/types';
import { YardMove } from 'logs/YardMove';
import LogsDocument from 'mongoDb/document/document';
import mongoose, { FilterQuery, Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { onSleeperBerth } from '../logs/OnSleeperBerth';
import { AppService } from './app.service';
import * as _ from 'lodash';
import moment from 'moment-timezone';
import { InjectModel } from '@nestjs/mongoose';
import EditInsertLogsDocument from 'mongoDb/document/editInsertLogsDocument';
import editInsertLogHistory from 'mongoDb/document/editInsertLogHistoryDocument';
import { paginator } from 'utils/pagination';
@Injectable({ scope: Scope.DEFAULT  })
export class LogsService {
  private readonly logger = new Logger('HOSLogsService');

  constructor(
    @Inject('AppService') private readonly appService: AppService,
    @Inject('VEHICLE_SERVICE') private readonly client: ClientProxy,
    @InjectModel('EditInsertLogs')
    private editInsertLogsModel: Model<EditInsertLogsDocument>,
    @InjectModel('EditInsertLogHistory')
    private editInsertLogHistoryModel: Model<editInsertLogHistory>,
  ) {}

  resetBreak = () => {
    this.onBreak.resetBreakData();
  };

  /**
   * @Obsolete following function (canResumeDuty) will be deleted in future as it is not required anymore because the flow is completed by setViolations function in HOSIMC, please dont use
   */
  canResumeDuty = () => {
    this.onDuty.canResumeOnDuty();
  };

  hOSStatusInMemoryCalculatedStats: HOSStatusInMemoryCalculatedStats =
    new HOSStatusInMemoryCalculatedStats();

  onDuty: OnDuty = new OnDuty(this.hOSStatusInMemoryCalculatedStats);
  onBreak: OnBreak = new OnBreak(this.hOSStatusInMemoryCalculatedStats);
  onDriving: OnDriving = new OnDriving(
    this.hOSStatusInMemoryCalculatedStats,
    this.resetBreak,
    this.canResumeDuty,
  );
  offDuty: OffDuty = new OffDuty(this.hOSStatusInMemoryCalculatedStats);
  onSleeperBerth: onSleeperBerth = new onSleeperBerth(
    this.hOSStatusInMemoryCalculatedStats,
  );
  onPersonalConveyance: PersonalConveyance = new PersonalConveyance(
    this.hOSStatusInMemoryCalculatedStats,
  );
  onYardMove: YardMove = new YardMove(this.hOSStatusInMemoryCalculatedStats);
  eldEvents: EldEvents = new EldEvents(this.hOSStatusInMemoryCalculatedStats);

  /**
   *
   * @description This function is to restore data of all status objects from the current in memory calculated data.
   * To be used when a db entry is found and its data has been restored to in memory calculator class instance.
   */
  restoreDataOfAllInstances = () => {
    this.onDuty.restoreSelfDataFromInMemoryCalculationInstance();
    this.offDuty.restoreSelfDataFromInMemoryCalculationInstance();
    this.onDriving.restoreSelfDataFromInMemoryCalculationInstance();
    this.onBreak.restoreSelfDataFromInMemoryCalculationInstance();
    this.onSleeperBerth.restoreSelfDataFromInMemoryCalculationInstance();
  };

  createLogEntry = async (
    logEntries: LogEntry | Array<LogEntry>,
    driver: any,
    resetFlag: Boolean = true,
    includeInCalculations: Boolean = true,
  ): Promise<LogsDocument> => {
    let {
      id: driverId,
      tenantId,
      firstName,
      lastName,
      vehicleId,
      companyTimeZone,
    } = driver;

    const logEntriesToPush = Array.isArray(logEntries)
      ? [...logEntries]
      : [logEntries];
    const currentDate = moment().tz(companyTimeZone).unix();

    const lastEntry = await this.appService.findDbEntry(
      {
        'driver.id': driverId,
        tenantId,
        isActive: true,
      },
      { logs: 0 },
    );

    if (lastEntry) {
      this.hOSStatusInMemoryCalculatedStats.setInstanceData(lastEntry);
      this.restoreDataOfAllInstances();
    }
    this.hOSStatusInMemoryCalculatedStats.setCompanyTimeZone(
      driver.companyTimeZone,
    );

    /**
     * TODO: Umer:  this code needs to handle scenario w.r.t calculate, if the onDuty time has been completed, we need to prevent log entry.
     * same goes for on driving.
     */

    const messagePatternVehicle =
      await firstValueFrom<MessagePatternResponseType>(
        this.client.send({ cmd: 'get_vehicle_by_id' }, vehicleId),
      );

    if (messagePatternVehicle.isError) {
      mapMessagePatternResponseToException(messagePatternVehicle);
    }

    await this.calculateLogs(
      logEntriesToPush,
      driverId,
      tenantId,
      false,
      messagePatternVehicle,
      includeInCalculations,
    );

    const dataToBeSaved: LogsDocumentContentsType = {
      ...JSON.parse(JSON.stringify(this.hOSStatusInMemoryCalculatedStats)), //need to revist
    };

    // we can opt object.assign rather stringy and json parse
    if (!dataToBeSaved?.calendarStartDate) {
      dataToBeSaved.calendarStartDate = currentDate;
    }

    dataToBeSaved.driver = {
      id: driverId,
      tenantId: tenantId,
      firstName: firstName,
      lastName: lastName,
    };

    // If an entry was found update that entry, otherwise add a new entry to DB.
    let resp: LogsDocument;
    if (lastEntry) {
      await this.appService
        .updateInDB(dataToBeSaved, lastEntry.id, true)
        .then((data) => {
          if (resetFlag) this.deleteObjectsAfterSavingThemInDB();
          resp = data;
        });
    } else {
      await this.appService.addToDB(dataToBeSaved).then((data) => {
        if (resetFlag) this.deleteObjectsAfterSavingThemInDB();
        resp = data;
      });
    }
    return resp;
  };

  resetHosInstance = () => {
    this.deleteObjectsAfterSavingThemInDB();
    this.hOSStatusInMemoryCalculatedStats =
      new HOSStatusInMemoryCalculatedStats();
    this.onDuty = new OnDuty(this.hOSStatusInMemoryCalculatedStats);
    this.onBreak = new OnBreak(this.hOSStatusInMemoryCalculatedStats);
    this.onDriving = new OnDriving(
      this.hOSStatusInMemoryCalculatedStats,
      this.resetBreak,
      this.canResumeDuty,
    );
    this.offDuty = new OffDuty(this.hOSStatusInMemoryCalculatedStats);
    this.onSleeperBerth = new onSleeperBerth(
      this.hOSStatusInMemoryCalculatedStats,
    );
  };

  editLogEntry = async (
    logEntriesArray: LogEntry[][],
    driver: any,
    requestStatus: Boolean,
  ): Promise<any> => {
    const { _id, tenantId, firstName, lastName, vehicleId, companyTimeZone } =
      driver;

    let driverId = driver.id || _id;
    let query: FilterQuery<LogsDocument> = {
      'driver.id': driverId,
      'driver.tenantId': tenantId,
    };
    const logEntryIds = [];
    let dbLogs;
    let resp: LogsDocument;
    for (let index = 0; index < logEntriesArray.length; index++) {
      let logEntries = logEntriesArray[index];
      const firstLogEntry = logEntries[0];
      const logEntry = firstLogEntry;
      let result;
      if (!logEntry.id && logEntry.isManual) {
        const statusKey = StatusKey[logEntry.actionType];
        let logEntryObject = JSON.parse(JSON.stringify(logEntry));
        logEntryObject.isManual = true;
        // delete logEntryObject.statusesData[statusKey].lastStartedAt;
        let driverObject = {
          id: driverId,
          tenantId: tenantId,
          firstName: firstName,
          lastName: lastName,
          vehicleId: vehicleId,
          companyTimeZone: companyTimeZone,
        };
        const update = { $push: { logs: { ...logEntryObject } } };
        const options = {
          new: true,
        };
        result = await this.appService.findAndUpdateDriverLogsInDB(
          { ...query, isActive: true },
          update,
          options,
        );
        const newLogEntryId =
          result.logs[result.logs.length - 1]._id.toString();
        logEntry.id = newLogEntryId;
        logEntry.parentId = newLogEntryId;
        resp = result;
        dbLogs = result;
      }
      query = { ...query, ...(logEntry.id && { 'logs._id': logEntry.id }) };
      let obj = {};
      /**If log edit request is not approved, it will create a object "editRequest",
       * otherwise it will copy the content from "editRequest" to "update"
       */
      if (requestStatus === true) {
        obj['$set'] = { 'logs.$[element].updated': logEntries }; //"logs.$[element].editRequest"
        obj['$unset'] = { 'logs.$[element].editRequest': '' };
        // if (logEntry.annotation) {
        //   obj['$set'] = { "logs.$[element].updated.annotation": logEntry.annotation, "logs.$[element].updated.notes": logEntry.notes };
        // }
      } else if (requestStatus === false) {
        ///to remove the parent level doc
        if (logEntry.isManual === true) {
          obj['$pull'] = { logs: { _id: logEntry.id } };
        } else {
          obj['$unset'] = { 'logs.$[element].editRequest': '' };
        }
      } else {
        obj['$set'] = { 'logs.$[element].editRequest': logEntries };
        // if (logEntry.annotation) {
        //   obj['$set'] = { "logs.$[element].annotation": logEntry.annotation, "logs.$[element].notes": logEntry.notes };
        // }
      }
      const update = { ...obj };
      const options = {
        arrayFilters: [{ 'element._id': logEntry.id }],
        new: true,
      };
      await this.appService.findAndUpdateDriverLogsInDB(query, update, options);
      delete query['logs._id'];

      let dbDriverLog = await this.appService.findDbEntry(query);
      dbDriverLog.logs = dbDriverLog?.logs.filter(
        (f) =>
          !(
            f.actionType === 'LOGIN' ||
            f.actionType === 'LOGOUT' ||
            f.eventType
          ),
      ); // need to revisit and add filter in query
      dbLogs = dbDriverLog;
      resp = dbLogs;
      logEntryIds.push(logEntry.id);
    }

    /**
     * Only re run the calculations if request is approved,otherwise the change is saved in the respective logs
     */
    if (requestStatus === true) {
      this.resetHosInstance();
      this.hOSStatusInMemoryCalculatedStats.setCompanyTimeZone(companyTimeZone);
      await this.calculateLogs(
        dbLogs.logs,
        driverId,
        tenantId,
        true,
        null,
        true,
      );
      const dataToBeSaved: LogsDocumentContentsType = {
        ...JSON.parse(JSON.stringify(this.hOSStatusInMemoryCalculatedStats)),
      };
      const violatedLogs = dataToBeSaved.logs.filter((l) => l.isViolation);
      if (violatedLogs.length > 0) {
        for (let index = 0; index < violatedLogs.length; index++) {
          const element = violatedLogs[index];
          let queryForViolations: FilterQuery<LogsDocument> = {
            'driver.id': driverId,
            'driver.tenantId': tenantId,
          };
          const options = {
            arrayFilters: [
              { 'element._id': element.parentId },
              { 'updatedElement._id': element._id },
            ],
          };
          let objForViolations = {};
          objForViolations['$set'] = {
            'logs.$[element].updated.$[updatedElement].violations':
              element.violations,
          };
          const updateForViolation = { ...objForViolations };
          let test = await this.appService.findAndUpdateDriverLogsInDB(
            queryForViolations,
            updateForViolation,
            options,
          );
        }
      }
      delete dataToBeSaved.logs; //To prevent the original data
      await this.appService
        .updateInDB(dataToBeSaved, dbLogs._id)
        .then((data) => {
          this.deleteObjectsAfterSavingThemInDB();
          resp = data;
        });
    }
    resp.logEntryIds = logEntryIds;
    return resp;
  };

  getContinuedStatusLogs = (logs) => {
    let sortedLogs = logs.sort((a, b) => a['actionDate'] - b['actionDate']);
    let onGoingArray = [];
    let lastEntryFound = false;
    for (let i = sortedLogs.length - 1; i >= 0 && !lastEntryFound; i--) {
      let l = sortedLogs[i];
      let std = l.get('statusesData')['_doc'];
      let lastEntryFound = Object.keys(std).reduce(
        (res, curr) => res || std[curr].hasOwnProperty('lastStartedAt'),
        false,
      );
      if (!lastEntryFound) {
        onGoingArray.push(sortedLogs[i]);
      } else {
        break;
      }
    }
    return onGoingArray.reverse();
  };

  getLogsToInsert = (logs, editCall) => {
    let required = [];
    for (let i = 0; i < logs.length; i++) {
      //To point the updated values in case Approved by driver
      let l = logs[i];
      if (l.updated && l.updated.length > 0) {
        for (let index = 0; index < l.updated.length; index++) {
          const ul = l.updated[index];
          const s = StatusKey[ul.actionType];
          if (ul.statusesData[s].startedAt) {
            required.push(ul);
          }

          //await this.sendLogEntryToCalculations(ul, driverId, tenantId, vehicle);
        }
      } else {
        if (l.eventType in EventType) {
          required.push(l);
        } else {
          try {
            let std = editCall
              ? l.get('statusesData')?.['_doc']
              : l.statusesData;
            if (!std) continue;
            let calcFlag = Object.keys(std).reduce(
              (res, curr) => res || std[curr].hasOwnProperty('lastStartedAt'),
              false,
            );
            if (calcFlag || !editCall) {
              required.push(l);
              //await this.sendLogEntryToCalculations(l, driverId, tenantId, vehicle);
            }
          } catch (error) {
            console.log(error);
          }
        }
      }
    }
    required.sort((a, b) => a['actionDate'] - b['actionDate']);
    return required;
  };

  calculateLogs = async (
    logs,
    driverId,
    tenantId,
    editCall: boolean,
    vehicle = null,
    insertLogsWithCalculation,
  ) => {
    let required = this.getLogsToInsert(logs, editCall);

    for (let index = 0; index < required.length; index++) {
      await this.sendLogEntryToCalculations(
        required[index],
        driverId,
        tenantId,
        vehicle,
        insertLogsWithCalculation,
      );
    }

    if (editCall) {
      let onGoingArray = this.getContinuedStatusLogs(logs);
      for (let i = 0; i < onGoingArray.length; i++) {
        let l = onGoingArray[i];
        await this.sendLogEntryToCalculations(l, driverId, tenantId, vehicle);
      }
    }
  };

  sendLogEntryToCalculations = async (
    logEntry,
    driverId,
    tenantId,
    vehicle,
    includeInCalculations: Boolean = true,
  ) => {
    let parsedLogEntry = JSON.parse(JSON.stringify(logEntry));
    await this.calculateLogEntry(
      parsedLogEntry,
      driverId,
      tenantId,
      vehicle,
      includeInCalculations,
    );
  };

  calculateLogEntry = async (
    logEntry,
    driverId,
    tenantId,
    vehicle,
    includeInCalculations,
  ) => {
    logEntry.driverId = driverId;
    logEntry.tenantId = tenantId;

    if (vehicle) {
      logEntry.vehicleManualId = vehicle.data.vehicleId;
    }

    if (logEntry?.eventType && logEntry?.eventType !== 'PER') {
      this.eldEvents.addEvent(logEntry);
    } else if (
      logEntry.actionType === LogActionType.ON_DUTY_NOT_DRIVING &&
      includeInCalculations
    ) {
      this.update30MinutesBreak(logEntry);
      this.onDuty.setStatus(logEntry);
      this.onDuty.calculate();
    } else if (
      logEntry.actionType === LogActionType.OFF_DUTY &&
      includeInCalculations
    ) {
      this.offDuty.setStatus(logEntry);
      this.offDuty.calculate();
      this.updateShiftReset();
    } else if (
      logEntry.actionType === LogActionType.DRIVING &&
      includeInCalculations
    ) {
      this.onDriving.setStatus(logEntry);
      this.onDriving.calculate();
    } else if (
      logEntry.actionType === LogActionType.SLEEPER_BERTH &&
      includeInCalculations
    ) {
      this.update30MinutesBreak(logEntry);
      this.onSleeperBerth.setStatus(logEntry);
      this.onSleeperBerth.calculate();
      this.updateShiftReset();
    }
  };

  update30MinutesBreak = (logEntry: Partial<LogEntry>) => {
    this.onBreak.setStatus(logEntry);
    this.onBreak.calculate();
  };

  updateShiftReset = () => {
    const minimumOffTimeRequired = this.onBreak.msToTime(
      this.onBreak.hoursToMilliSeconds(10),
      MSToTimeReturnType.Seconds,
    );

    const currentStatusesData =
      this.hOSStatusInMemoryCalculatedStats.statusesData;

    if (
      this.hOSStatusInMemoryCalculatedStats.continuousOffTimeInSeconds >=
      minimumOffTimeRequired
    ) {
      this.hOSStatusInMemoryCalculatedStats.shiftStartDateTime = undefined;
      /* ALI */
      this.hOSStatusInMemoryCalculatedStats.shiftStartStatus = 0;
    }
  };

  calculateLogDataUptoNow = async (driverId) => {
    const latestLogEntry: LogsDocument = await this.appService.findLatestEntry({
      'driver.id': driverId,
    });
    let response = latestLogEntry && latestLogEntry.toJSON();
    if (response?.statusesData?.onDriving) {
      response.statusesData.onDriving = this.onDriving.calculateForLiveData(
        response.statusesData.onDriving,
      );
    }
    if (response?.statusesData?.onDuty) {
      response.statusesData.onDuty = this.onDuty.calculateForLiveData(
        response.statusesData.onDuty,
      );
    }
    if (response?.statusesData?.offDuty) {
      response.statusesData.offDuty = this.offDuty.calculateForLiveData(
        response.statusesData.offDuty,
      );
    }
    if (response?.statusesData?.onSleeperBerth) {
      response.statusesData.onSleeperBerth =
        this.onSleeperBerth.calculateForLiveData(
          response.statusesData.onSleeperBerth,
        );
    }
    if (response?.statusesData?.onYardMove) {
      response.statusesData.onYardMove = this.onYardMove.calculateForLiveData(
        response.statusesData.onYardMove,
      );
    }
    if (response?.statusesData?.onPersonalConveyance) {
      response.statusesData.onPersonalConveyance =
        this.onPersonalConveyance.calculateForLiveData(
          response.statusesData.onPersonalConveyance,
        );
    }
    return response;
  };

  calculateClockData = async (driver: any): Promise<any> => {
    let { id: driverId, tenantId } = driver;
    const lastEntry = await this.appService.findDbEntry({
      'driver.id': driverId,
      tenantId,
      isActive: true,
    });

    if (lastEntry) {
      this.hOSStatusInMemoryCalculatedStats.setInstanceData(lastEntry);
      this.restoreDataOfAllInstances();
    }
    return this.hOSStatusInMemoryCalculatedStats.clockData();
  };

  /**
   * Edit Insert Logs - V2
   * Author : Farzan
   */
  editInsertLogs = async (isEdit, logs) => {
    let response;

    let obj;
    if (!isEdit) {
      obj = await this.editInsertLogsModel.create(logs);
    } else {
      obj = await this.editInsertLogsModel.findOneAndUpdate(
        { _id: isEdit._id },
        logs,
        { new: true },
      );
    }

    if (obj) {
      response = {
        statusCode: 201,
        message: 'Correction recorded!',
        data: obj,
      };
      return response;
    }
    response = {
      statusCode: 400,
      message: 'Something went wrong while creating correction request!',
      data: {},
    };
    return response;
  };

  /**
   * isEditInsertReqExists - V2
   * Author : Farzan
   */
  isEditInsertReqExists = async (dateTime: Date, driverId: String) => {
    console.group(`date -------- `, {
      driverId: driverId,
      dateTime: dateTime,
      isApproved: 'pending',
    });
    const isEdit = await this.editInsertLogsModel.findOne({
      driverId: driverId,
      dateTime: dateTime,
      isApproved: 'pending',
    });
    if (isEdit) {
      return isEdit;
    }
    return isEdit;
  };
  /**
   * get all pending edit insert requests - V2
   * Author : Farzan
   */
  getPendingRequests = async (driverInfo) => {
    const isEdit = await this.editInsertLogsModel
      .find({
        driverId: driverInfo.id,
        isApproved: 'pending',
        requestStatus: { $in: ['Sent'] },
      })
      .lean();

    return isEdit;
  };
  /**
   * responseToEditInsertLog - V2
   * Author : Farzan
   */
  responseToEditInsertLog = async (
    driver,
    dateTime,
    isApproved,
    statusStr,
    notificationStatus,
  ) => {
    const editReq = await this.editInsertLogsModel.findOne({
      // driverId: driverId,
      dateTime: dateTime,
      isApproved: 'pending',
    });

    if (editReq) {
      editReq.isApproved = isApproved;
      editReq.requestStatus = notificationStatus;
      editReq.status = statusStr;
      editReq.action = isApproved == 'confirm' ? 'Accept' : 'Reject';
      await editReq.save();

      return {
        statusCode: 200,
        message: `Edit request ${
          isApproved == 'confirm' ? 'confirmed' : 'cancelled'
        } successfully!`,
        data: editReq,
      };
    }
    return {
      statusCode: 200,
      message: `Edit insert log not found!`,
      data: {},
    };
  };

  /**
   * Fetch EditInsertLog history - V2
   * Author : Farzan
   */
  editInsertLogHistory = async (query) => {
    const { skip, limit } = paginator(query);
    console.log(`driverid check ===== `, query.driverId);

    const obj = await this.editInsertLogHistoryModel.aggregate([
      {
        $match: {
          driverId: query.driverId,
        },
      },
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: JSON.parse(limit) }],
          totalCount: [{ $count: 'total' }],
        },
      },
    ]);

    const results = obj[0]?.paginatedResults;
    const total = obj[0]?.totalCount[0]?.total;

    if (obj[0].totalCount.length > 0) {
      return {
        statusCode: 200,
        message: `Edit insert log history fetched!`,
        data: results,
        pageNo: JSON.parse(query.pageNo),
        last_page: Math.ceil(total / limit),
        total: total,
      };
    }
    return {
      statusCode: 404,
      message: `Edit insert log history not available!`,
      data: results,
      pageNo: JSON.parse(query.pageNo),
      last_page: Math.ceil(total / limit) || query.pageNo,
      total: total || 0,
    };
  };

  /**
   * History of edit insert logs - V2
   * Author : Farzan
   */
  maintainHistory = async (object) => {
    try {
      const histCreated = await this.editInsertLogHistoryModel.create(object);
      return histCreated ? true : false;
    } catch (error) {
      console.log(
        `Error in maintaining history --------------- `,
        error.message,
      );
    }
  };

  /***
   * May be we need to assign object to null rather deleting them.
   */
  private deleteObjectsAfterSavingThemInDB = () => {
    delete this.hOSStatusInMemoryCalculatedStats;
    delete this.onDuty;
    delete this.onDriving;
    delete this.onBreak;
    delete this.offDuty;
    delete this.onSleeperBerth;
  };
}
