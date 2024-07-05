import { LastKnownLocationRequest } from './../models/lastKnownLocation';
import mongoose, {
  AggregateOptions,
  Callback,
  FilterQuery,
  Model,
  PipelineStage,
  ProjectionType,
  QueryOptions,
  QueryWithHelpers,
} from 'mongoose';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { ClientProxy, ClientTCP } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  MessagePatternResponseType,
  mapMessagePatternResponseToException,
  ConfigurationService,
  ListingParams,
  getTimeZoneDateRangeForDay,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { InjectModel } from '@nestjs/mongoose';
import LogsDocument, {
  LogEditRequestHistoryDocument,
  LogsEntryDocument,
} from 'mongoDb/document/document';
import moment, { invalid } from 'moment-timezone';

const ObjectId = mongoose.Types.ObjectId;
import { groupBy, mapValues, update } from 'lodash';
import { LogsController } from 'controllers/logs.controller';
import DriverLiveLocationDocument from 'mongoDb/document/driverLiveLocation.document';
import DriverStopLocationDocument from 'mongoDb/document/driverStopLocation.document';

import HistoryDocument from 'mongoDb/document/history.document';
import EditInsertLogsDocument from 'mongoDb/document/editInsertLogsDocument';
import { duplicateAndModifyDutyStatus } from 'utils/duplicateAndModifyDutyStatus';
import {
  removeDuplicateConsecutiveLogs,
  removeDuplicateConsecutiveLogss,
} from 'utils/removeDuplicateConsecutiveLogs';
import { getIntermediateType } from 'utils/getIntermediateType';
import { encrypt } from 'utils/encrypt';
import { decrypt } from 'utils/decrypt';

@Injectable({ scope: Scope.DEFAULT })
export class AppService {
  private readonly logger = new Logger('HOSStatusService');

  constructor(
    @InjectModel('logEditRequestHistory')
    private logEditRequestHistoryModel: Model<LogEditRequestHistoryDocument>,
    @InjectModel('EditInsertLogs')
    private editInsertLogModel: Model<EditInsertLogsDocument>,
    @InjectModel('driverLiveLocation')
    private driverLiveLocationModel: Model<DriverLiveLocationDocument>,
    @InjectModel('driverStopLocation')
    private driverStopLocationModel: Model<DriverStopLocationDocument>,
    @InjectModel('history')
    private historyModel: Model<HistoryDocument>,
    @Inject('UNITS_SERVICE') private readonly unitsClient: ClientProxy,
    @Inject('VEHICLE_SERVICE') private readonly client: ClientProxy,
    @Inject('DEVICE_SERVICE') private readonly deviceClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,

    private readonly configService: ConfigurationService,
  ) {}

  // get unit data on driver id
  getUnitData = async (driverId: string) => {
    try {
      const res = await firstValueFrom(
        this.unitsClient.send({ cmd: 'get_unit_by_driverId' }, driverId),
      );
      if (res.isError) {
        Logger.log('Error in getting  Graph data from UNIT srvice');
        mapMessagePatternResponseToException(res);
      }
      return res.data;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  setOnDuty = async (driverId: string): Promise<boolean> => {
    let success = false;

    const messagePatternFirstValue = await firstValueFrom(
      this.unitsClient.send<MessagePatternResponseType>(
        { cmd: 'is_unit_active' },
        driverId,
      ),
    );

    if (messagePatternFirstValue.isError) {
      mapMessagePatternResponseToException(messagePatternFirstValue);
    }

    success = messagePatternFirstValue.data;

    return success;
  };
  //socket call
  notifyDriver = async (
    SpecificClient,
    mesaage,
    responseMessage,
    responseData,
  ) => {};
  // crud operations below.

  getEldOnDeviceId = async (eldId) => {
    const messagePatternDevice = await firstValueFrom<MessagePatternResponseType>(
      this.deviceClient.send({ cmd: 'get_device_by_id' }, eldId),
    );

    if (messagePatternDevice.isError) {
      Logger.log(`Error while finding eld against eldId`);
      mapMessagePatternResponseToException(messagePatternDevice);
    }

    return messagePatternDevice;
  };

  // ): Promise<any[]> => {

  //   try {
  //     const driverLogsFieldsToIncludeInResponse = {
  //       actionDate: '$doc.actionDate',
  //       odoMeterMillage: '$doc.odoMeterMillage',
  //       odoMeterSpeed: '$doc.odoMeterSpeed',
  //       engineHours: '$doc.engineHours',
  //       vehicleManualId: '$doc.vehicleManualId',
  //       geoLocation: "$doc.geoLocation",
  //       appVersion: '$doc.appVersion',
  //       deviceVersion: '$doc.deviceVersion',
  //       notes: '$doc.notes',
  //       driver: '$doc.driver',
  //       id: '$doc._id',
  //       violations: '$doc.violations',
  //       deviceType: '$doc.deviceType',
  //       OSversion: '$doc.OSversion',
  //       annotation: '$doc.annotation',
  //       editRequest: '$doc.editRequest',
  //       updated: '$doc.updated',
  //       isManual: '$doc.isManual',
  //       lastKnownLocation: '$doc.lastKnownLocation'
  //     };

  //     const query: PipelineStage[] = [
  //       {
  //         '$match': {
  //           'driver.id': new ObjectId('6359545735d5d048709b2901'),
  //           'isActive': true
  //         }
  //       },
  //       {
  //         '$unwind': {
  //           'path': '$logs'
  //         }
  //       },
  //       {
  //         '$replaceRoot': {
  //           'newRoot': '$logs'
  //         }
  //       },
  //       {
  //         '$match': {
  //           'actionType': {
  //             '$nin': [
  //               'LOGIN', 'LOGOUT'
  //             ]
  //           }
  //         }
  //       },
  //       {
  //         '$project': {
  //           'actionDate': '$actionDate',
  //           'actionType': '$actionType',
  //           'logs': '$$ROOT',
  //           'lastStartedAt': {
  //             '$getField': {
  //               'field': 'lastStartedAt',
  //               'input': {
  //                 '$getField': {
  //                   'field': 'v',
  //                   'input': {
  //                     '$arrayElemAt': [
  //                       {
  //                         '$objectToArray': '$statusesData'
  //                       }, 1
  //                     ]
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       },
  //       {
  //         '$match': {
  //           'lastStartedAt': {
  //             '$exists': true
  //           }
  //         }
  //       },
  //       {
  //         '$replaceRoot': {
  //           'newRoot': '$logs'
  //         }
  //       }
  //     ];
  //     const resp = await this.driverLogsModel.aggregate(query);
  //     return resp;
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  // findLogsDbEntry = async (
  //   options: FilterQuery<LogsDocument>,
  //   projection: ProjectionType<LogsDocument> = {},
  //   mongooseOptn?: QueryOptions | null
  // ): Promise<LogsEntryDocument> => {
  //   try {
  //     let dataToReturn: LogsEntryDocument = null;
  //     let dataRetrieved = await this.driverLogsModel.findOne(options, projection, mongooseOptn);
  //     if (dataRetrieved?.logs)
  //       dataToReturn = dataRetrieved?.logs as any as LogsEntryDocument;

  //     return dataToReturn;
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  // findOneByAggregation = async (
  //   pipeline?: PipelineStage[], options?: AggregateOptions, callback?: Callback
  // ): Promise<LogsDocument> => {
  //   try {

  //     let dataToReturn: LogsDocument = null;
  //     const dataRetrieved = await this.driverLogsModel.aggregate(pipeline, options, callback);
  //     if (dataRetrieved?.length > 0)
  //       dataToReturn = dataRetrieved[0];

  //     return dataToReturn;
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  updateDataInUnits = async (data) => {
    const messagePatternFirstValue = await firstValueFrom(
      this.unitsClient.emit({ cmd: 'update_hos_data' }, data),
    );
  };
  // TODO -- need to shift this according to the companyTimZone

  /**
   * To update the logs on nested level
   * @param query to filter the main document i.e. date etc
   * @param update updated log for logs array
   * @param options nested level query filters
   * @returns
   */

  addEditLogRequestHistory = async (data, user, editedDay, requestStatus) => {
    try {
      const { id, tenantId, firstName, lastName, vehicleId } = data.driver;
      const driverObject = {
        id: id,
        tenantId: tenantId,
        firstName: firstName,
        lastName: lastName,
        vehicleId: vehicleId,
      };
      const dataToBeSaved = {
        driver: driverObject,
        editedBy: {
          id: user.id || user._id,
          name: `${user.firstName} ${user.lastName}`,
          editedDay: editedDay,
        },
        date: moment().unix(),
        parentLogDocumentId: data._id,
        isApproved: requestStatus,
        notes: data.notes,
      };
      const editRequestEntry = await this.logEditRequestHistoryModel
        .findOne({
          parentLogDocumentId: data._id,
          'editedBy.editedDay': editedDay,
        })
        .sort({ version: -1 });
      let result;
      if (!editRequestEntry) {
        result = await this.logEditRequestHistoryModel.create(dataToBeSaved);
      } else if (editRequestEntry && editRequestEntry.isApproved === true) {
        dataToBeSaved['version'] = editRequestEntry['version'] + 1;
        result = await this.logEditRequestHistoryModel.create(dataToBeSaved);
      } else {
        editRequestEntry.isApproved = true;
        result = await editRequestEntry.save();
      }
      return result;
    } catch (error) {
      Logger.log(`Error while performing action: ${error}`);
      throw error;
    }
  };

  // Helper function for <addLiveLocation> function to extract latitudes and longitudes from historyOfLocation array
  // extractLatLng = (historyOfLocations) => {
  //   let coordinates = [];

  //   for (let i = 0; i < historyOfLocations.length; i++) {
  //     const lat = historyOfLocations[i].latitude;
  //     const lng = historyOfLocations[i].longitude;
  //     coordinates.push([lat, lng]);
  //   }

  //   return coordinates;
  // };
  checkIfDocumentExists = async (driverId, date) => {
    try {
      const exists = await this.driverLiveLocationModel.exists({
        driverId: driverId,
        date: date,
      });
  
      return !!exists;
    } catch (error) {
      console.error('Error checking document existence:', error);
      throw error;
    }
  };
  /**
   * driver live location - V2
   * Author : Farzan
   */
  addLiveLocation = async (obj) => {
    const { driverId, tenantId, date, historyOfLocation } = obj;

    // Collect data for current date
    const driverLiveLocationTrackable =
      await this.checkIfDocumentExists(
        driverId,
         date,
      );

    // Append latest locations to the previous ones
    if (driverLiveLocationTrackable) {
      // driverLiveLocationTrackable.historyOfLocation = [
      //   ...driverLiveLocationTrackable.historyOfLocation,
      //   ...historyOfLocation,
      // ];

      // // Update the latest changes
      // await driverLiveLocationTrackable.save();
      const result = await this.driverLiveLocationModel.updateOne(
        { driverId: driverId, date: date },
        {
          $push: {
            historyOfLocation: { $each: historyOfLocation },
          },
        },
        { upsert: true } // This option creates the document if it doesn't exist
      );
    } else {
      // If record not exists, create a new one
      const isCreated = await this.driverLiveLocationModel.create({
        driverId,
        tenantId,
        date,
        historyOfLocation,
        encryptedHistoryOfLocation: '',
      });

      // Fetch last added record to encrypt data
      const allRecords = await this.driverLiveLocationModel.find({
        driverId: driverId,
      });
      const lastRecord = allRecords[allRecords.length - 2]; // Get entry before of the latest

      if (lastRecord) {
        // Extract lat, lng and encode the data
        // const coordinates = this.extractLatLng(lastRecord.historyOfLocation);
        const textToEncrypt = lastRecord.historyOfLocation;
        const encryptedString = await encrypt(textToEncrypt);

        // Empty the historyOfLocation list and assign encrypted string
        lastRecord.historyOfLocation = [];
        lastRecord.encryptedHistoryOfLocation = encryptedString;

        // Save the latest changes
        await lastRecord.save();
      }
    }

    return {
      statusCode: 200,
      message: 'Live location updated successfully!',
      data: {}
      // driverLiveLocationTrackable?.historyOfLocation
      //   ? driverLiveLocationTrackable?.historyOfLocation
      //   : [obj?.historyOfLocation],
    };
  };
 /**
   * driver stops - V2
   * Author : Not Farzan
   */
 addStops = async (obj) => {
  const { driverId, tenantId, date, historyOfLocation } = obj;

  // Collect data for current date
  const driverStopLocationTrackable =
    await this.driverStopLocationModel.findOne({
      driverId: driverId,
      date: date,
    });

  // Append latest locations to the previous ones
  if (driverStopLocationTrackable) {
    driverStopLocationTrackable.historyOfLocation = [
      ...driverStopLocationTrackable.historyOfLocation,
      ...historyOfLocation,
    ];

    // Update the latest changes
    await driverStopLocationTrackable.save();
  } else {
    // If record not exists, create a new one
    const isCreated = await this.driverStopLocationModel.create({
      driverId,
      tenantId,
      date,
      historyOfLocation,
    
    });

    
    
  }

  return {
    statusCode: 200,
    message: 'Live location updated successfully!',
    data: driverStopLocationTrackable?.historyOfLocation
      ? driverStopLocationTrackable?.historyOfLocation
      : [obj?.historyOfLocation],
  };
};

  /**
   * driver specific day trips
   * Author : Farzan
   */
  getLiveLocation = async (obj) => {
    const query = {
      driverId: obj.driverId,
      date: obj.date, // YYYY-MM-DD
    };

    const specificDayTrip = await this.driverLiveLocationModel.findOne(query);

    let decodedHistoryOfLocation;
    if (specificDayTrip) {
      // length == 0, indicates the previous day trips that are encrypted.
      // length != 0, indicates the current day trip. The current day trip is not encrypted.
      if (specificDayTrip.historyOfLocation.length == 0) {
        const encryptedHistoryOfLocation =
          specificDayTrip.encryptedHistoryOfLocation;
        decodedHistoryOfLocation = await decrypt(encryptedHistoryOfLocation);
      } else {
        decodedHistoryOfLocation = specificDayTrip.historyOfLocation;
      }
    }

    return {
      statusCode: 200,
      message: 'Live location fetched successfully!',
      data:
        decodedHistoryOfLocation && decodedHistoryOfLocation.length > 0
          ? decodedHistoryOfLocation
          : [],
    };
  };

    /**
   * driver specific day trips stops
   * Author : No Farzan
   */
    getStopsLocation = async (obj) => {
      const query = {
        driverId: obj.driverId,
        date: obj.date, // YYYY-MM-DD
      };
  
      const specificDayTrip = await this.driverStopLocationModel.findOne(query);
  
      let decodedHistoryOfLocation;
      if (specificDayTrip) {
        // length == 0, indicates the previous day trips that are encrypted.
        // length != 0, indicates the current day trip. The current day trip is not encrypted.
        if (specificDayTrip.historyOfLocation.length == 0) {
         
        } else {
          decodedHistoryOfLocation = specificDayTrip.historyOfLocation;
        }
      }
  
      return {
        statusCode: 200,
        message: 'Live location fetched successfully!',
        data:
          decodedHistoryOfLocation && decodedHistoryOfLocation.length > 0
            ? decodedHistoryOfLocation
            : [],
      };
    };
  maintainHistory = async (user, type, csvBeforeUpdate, csvAfterUpdate) => {
    const response = await this.editInsertLogModel.create({
      editedBy: {
        id: user.id,
        name: user.name,
      },
      type: type,
      csvBeforeUpdate: csvBeforeUpdate,
      csvAfterUpdate: csvAfterUpdate,
    });
    if (!csvAfterUpdate) {
      return {
        statusCode: 400,
        message: 'Edit history maintainence failed!',
        data: {},
      };
    }
    return {
      statusCode: 201,
      message: 'Edit history maintained!',
      data: response,
    };
  };

  getMaintainedHistory = async (queryParams, timeZone) => {
    let response;
    let startOfDay;
    let endOfDay;
    let where = {};
    let dateTime = {};
    let selectableString;

    // executable query
    where = {
      isApproved: {
        $ne: 'pending',
      },
    };

    if (!queryParams.detail) {
      const inputDate = moment(queryParams.date).format('YYYY-MM-DD');
      const { start } = getTimeZoneDateRangeForDay(
        inputDate,
        timeZone,
        // driverInfo.homeTerminalTimeZone.tzCode,
      );
      const { end } = getTimeZoneDateRangeForDay(
        inputDate,
        timeZone,
        // driverInfo.homeTerminalTimeZone.tzCode,
      );

      selectableString =
        '-csvBeforeUpdate -csvAfterUpdate -logs -driverId -tenantId';
      dateTime = {
        $gte: start,
        $lte: end,
      };
      if (!queryParams.id) {
        return {
          statusCode: 200,
          message: 'driverId not found add id in params!',
          data: [],
        };
      }
      const id = queryParams.id;
      where = {
        ...where,
        dateTime: dateTime,
        driverId: id,
      };
    } else {
      selectableString = 'csvBeforeUpdate csvAfterUpdate';
      const id = queryParams.id;
      where = {
        ...where,
        _id: id,
      };
    }

    response = await this.editInsertLogModel
      .find(where)
      .select(selectableString);

    if (response.length < 1) {
      return {
        statusCode: 200,
        message: 'No records available!',
        data: [],
      };
    }

    // Line below returns histories in array and detail in object
    response = queryParams.detail == 'true' ? response[0] : response;

    return {
      statusCode: 200,
      message: 'History fetched!',
      data: response,
    };
  };

  // to get orignal logs of the day
  getOrignalLogs = async (queryParams) => {
    let response;
    let startOfDay;
    let endOfDay;
    let where = {};
    let dateTime = {};
    let selectableString;

    // executable query
    where = {
      isApproved: {
        $ne: 'pending',
      },
    };

    const inputDate = moment(queryParams.date).format('YYYY-MM-DD');
    const { start } = getTimeZoneDateRangeForDay(
      inputDate,
      'America/Chicago',
      // driverInfo.homeTerminalTimeZone.tzCode,
    );
    const { end } = getTimeZoneDateRangeForDay(
      inputDate,
      'America/Chicago',
      // driverInfo.homeTerminalTimeZone.tzCode,
    );

    selectableString = '-csvAfterUpdate -logs -driverId -tenantId';
    dateTime = {
      $gte: start,
      $lte: end,
    };
    if (!queryParams.id) {
      return {
        statusCode: 200,
        message: 'driverId not found add id in params!',
        data: [],
      };
    }
    const id = queryParams.id;
    where = {
      ...where,
      dateTime: dateTime,
      driverId: id,
    };
    response = await this.editInsertLogModel
      .find(where)
      .select(selectableString)
      .lean();
    if (response.length < 1) {
      return {
        statusCode: 200,
        message: 'No records available!',
        data: [],
      };
    }

    const logs = response.filter((element) => {
      const dateOfLogs = moment
        .unix(Number(element.dateTime))
        .tz('America/Chicago');
      if (
        moment(element.editDate).format('YYYY-MM-DD') !=
        moment(dateOfLogs).format('YYYY-MM-DD')
      ) {
        return element;
      }
    });
    logs.sort(
      (a, b) => moment(a.editDate).valueOf() - moment(b.editDate).valueOf(),
    );

    return {
      statusCode: 200,
      message: 'Orignal Log fetched!',
      data: logs[0],
    };
  };

  convertToUTC = (dateString) => {
    // Replace the time zone offset with "+00:00"
    const modifiedDateString = dateString.replace(
      /([-+]\d{2}:\d{2})$/,
      '+00:00',
    );
    return modifiedDateString;
  };

  /**
   * Edit log
   * Author : Farzan
   */
  performEditOnLogs = async (payloadLog, dutyStatusList) => {
    let startTimeChange = false;
    let endTimeChange = false;
    let statusChange = false;
    let flag = false;
    let nextIndex;
    let dutyStatusListLengthBeforeEdit = 0;
    let lastItem;

    // Function for log ( Editable Conditions )
    const editableLogConditions = (log) => {
      const editableEventTypes = ['1', '3'];
      if (
        editableEventTypes.includes(log.eventType) &&
        log.eventRecordStatus == '1'
      )
        return true;
      return false;
    };

    // Filter active and inActiveLogs
    dutyStatusList = dutyStatusList.filter(
      (item) => item.eventRecordStatus == '1', // active
    );
    // dutyStatusList = this.sortingDateTime(dutyStatusList);
    //
    const inActiveLogs = dutyStatusList.filter(
      (item) => item.eventRecordStatus == '2', // In active
    );

    // Caprure desired index adn next active index
    let index = dutyStatusList.findIndex(
      (obj) => obj.eventSequenceIdNumber === payloadLog.eventSequenceIdNumber,
    );
    for (let i = index + 1; i < dutyStatusList.length; i++) {
      if (editableLogConditions(dutyStatusList[i])) {
        nextIndex = i;
        break;
      }
    }

    if (index != -1) {
      //The following code transfers or disables intermediate locations upon successfull status change
      dutyStatusList = await this.switchIntermediateAndChangeIntermediateType(
        payloadLog,
        dutyStatusList,
        index,
        nextIndex,
      );

      // Find the log that is edited and turn it's edited properties to true
      if (
        editableLogConditions(dutyStatusList[index]) &&
        // dutyStatusList[index].eventType == '1' &&
        // dutyStatusList[index].eventRecordStatus == '1' &&
        payloadLog.startTime !== dutyStatusList[index].eventTime
      ) {
        startTimeChange = true;
      }
      if (
        nextIndex != undefined &&
        (dutyStatusList[nextIndex].eventType == '1' ||
          dutyStatusList[nextIndex].eventType == '3') &&
        payloadLog.endTime !== dutyStatusList[nextIndex].eventTime
      ) {
        endTimeChange = true;
      }
      if (
        (editableLogConditions(dutyStatusList[index]) &&
          // dutyStatusList[index].eventType == '1' &&
          // dutyStatusList[index].eventRecordStatus == '1' &&
          payloadLog.eventCode !== dutyStatusList[index].eventCode) ||
        payloadLog.eventType !== dutyStatusList[index].eventType
      ) {
        statusChange = true;
      }

      // To create a duplicate and add to array of duty logs
      if (startTimeChange || endTimeChange || statusChange) {
        dutyStatusList[index].eventRecordStatus = '2';

        for (let i = dutyStatusList.length - 1; i >= 0; i--) {
          if (
            editableLogConditions(dutyStatusList[i])
            // dutyStatusList[i].eventType == '1' &&
            // dutyStatusList[i].eventRecordStatus == '1'
          ) {
            lastItem = dutyStatusList[i];
            break;
          }
        }

        dutyStatusListLengthBeforeEdit = dutyStatusList.length;
        dutyStatusList = duplicateAndModifyDutyStatus(
          dutyStatusList[index], // Item to be duplicated
          dutyStatusList, // duto logs array
          payloadLog, // payloadLog from client side
          true, // to toggle values
        );
      } else {
        // If status, start and end time are not changed, only lat, lng, odom etc are edited!dth d
        dutyStatusList[index]['eventRecordOrigin'] = '3';

        dutyStatusList[index]['shippingId'] = payloadLog.shippingId;
        dutyStatusList[index]['trailerId'] = payloadLog.trailerId;
        dutyStatusList[index]['eventLatitude'] = payloadLog.eventLatitude;        
        dutyStatusList[index]['eventLongitude'] = payloadLog.eventLongitude;
        dutyStatusList[index]['totalVehicleMilesDutyStatus'] =
          payloadLog.totalVehicleMilesDutyStatus;
        dutyStatusList[index]['totalEngineHoursDutyStatus'] =
          payloadLog.totalEngineHoursDutyStatus;
        dutyStatusList[index]['address'] = payloadLog.address;
        dutyStatusList[index]['notes'] = payloadLog.notes;
      }

      if (dutyStatusList.length > 1) {
        if (startTimeChange) {
          if (
            dutyStatusList[index].eventType == '1' &&
            dutyStatusList[index].eventCode == '3'
          ) {
            index = this.getNextIndex(
              index,
              dutyStatusListLengthBeforeEdit,
              dutyStatusList,
            );
          }
          for (let i = index - 1; i >= 0; i--) {
            const item = dutyStatusList[i];

            if (
              editableLogConditions(item) &&
              // item.eventType == '1' &&
              // item.eventRecordStatus == '1' &&
              item.eventTime >= payloadLog.startTime
            ) {
              item.eventRecordStatus = '2';
            }
            if (item.eventType == 2) {
              if (item.eventTime >= payloadLog.startTime) {
                item.intermediateType = getIntermediateType(payloadLog);
              } else if (item.eventTime < payloadLog.startTime) {
                const drIn = this.getPrevIndex(
                  index,
                  dutyStatusListLengthBeforeEdit,
                  dutyStatusList,
                );
                item.intermediateType = getIntermediateType(
                  dutyStatusList[drIn],
                );
              }
            }
            // else {
            //   break;""
            // }
          }
        }

        if (endTimeChange) {
          for (let i = index + 1; i < dutyStatusListLengthBeforeEdit; i++) {
            const item = dutyStatusList[i];
            if (item.eventType == 2 && !editableLogConditions(item)) {
              let drIn;
              if (item.eventTime > payloadLog.endTime) {
                drIn = this.getNextIndex(
                  index,
                  dutyStatusListLengthBeforeEdit,
                  dutyStatusList,
                );
                item.intermediateType = getIntermediateType(
                  dutyStatusList[drIn],
                );
              } else if (item.eventTime < payloadLog.endTime) {
                // drIn = this.getPrevIndex(index,dutyStatusListLengthBeforeEdit,dutyStatusList);
                item.intermediateType = getIntermediateType(payloadLog);
              }
            }
            if (
              editableLogConditions(item)
              // item.eventType == '1' && item.eventRecordStatus == '1'
            ) {
              if (
                editableLogConditions(lastItem) &&
                // lastItem.eventRecordStatus == '1' &&
                // lastItem.eventType == '1' &&
                payloadLog.endTime > lastItem.eventTime
              ) {
                flag = true;
              }

              if (item.eventTime <= payloadLog.endTime) {
                //mark this item as inactive in csv db
                dutyStatusList[i].eventRecordStatus = '2';
              } else if (item.eventTime > payloadLog.endTime) {
                /**
                 * Setting up correct before and after logs of item - Start
                 */
                // let logAfterItem;
                // let logBeforeItem;
                // for (
                //   let j = index + 1;
                //   j < dutyStatusListLengthBeforeEdit;
                //   j++
                // ) {
                //   if (
                //     dutyStatusList[j].eventType == '1' &&
                //     dutyStatusList[j].eventRecordStatus == '1'
                //   ) {
                //     logAfterItem = dutyStatusList[j];
                //   }
                // }
                // for (let k = index - 1; k >= 0; k--) {
                //   if (
                //     dutyStatusList[k].eventType == '1' &&
                //     dutyStatusList[k].eventRecordStatus == '1'
                //   ) {
                //     logBeforeItem = dutyStatusList[k];
                //   }
                // }
                /**
                 * Setting up correct before and after logs of item - End
                 */
                let drIn = index;
                if (dutyStatusList[index + 1].eventType == '2') {
                  for (let sub = index; sub < i; sub++) {
                    if (dutyStatusList[sub + 1].eventType == '2') {
                      drIn++;
                    } else break;
                  }
                  index = drIn;
                }
                if (
                  dutyStatusList[index + 1] &&
                  dutyStatusList[index + 1].eventTime > payloadLog.endTime
                ) {
                  if (item.eventType == 2) {
                    item.intermediateType = getIntermediateType(payloadLog);
                  }
                  dutyStatusList[i].eventRecordStatus = '2';
                  dutyStatusList = duplicateAndModifyDutyStatus(
                    dutyStatusList[i], // Item to be duplicated
                    dutyStatusList, // dutyStatusArray
                    payloadLog, // payloadLog from client side
                    false, // toggles values
                  );
                } else {
                  // flag = false;
                  //mark this as inactive , duplicate this item and set it's time to new lastStartedAt
                  let drIn = i;
                  if (dutyStatusList[i - 1].eventType == '2') {
                    for (let sub = i; sub > 0; sub--) {
                      if (dutyStatusList[sub - 1].eventType == '2') {
                        drIn--;
                      } else break;
                    }
                    i = drIn;
                  }

                  dutyStatusList[i - 1].eventRecordStatus = '2';
                  dutyStatusList = duplicateAndModifyDutyStatus(
                    dutyStatusList[i - 1], // Item to be duplicated
                    dutyStatusList, // dutyStatusArray
                    payloadLog, // payloadLog from client side
                    false, // toggles values
                  );
                }
                break;
              }
            }
          }

          if (flag) {
            // if (lastItem.eventRecordStatus != '2') {
            lastItem.eventRecordStatus = '2';
            dutyStatusList = duplicateAndModifyDutyStatus(
              lastItem, // Item to be duplicated
              dutyStatusList, // dutyStatusArray
              payloadLog, // payloadLog from client side
              false, // toggles values
            );
            flag = false;
            // }
          }
        }
      }

      dutyStatusList = [...dutyStatusList, ...inActiveLogs];

      // Sort the altered array
      dutyStatusList.sort((a, b) => {
        const timeA = parseInt(a.eventTime, 10);
        const timeB = parseInt(b.eventTime, 10);
        return timeA - timeB;
      });

      //Duty status list after duplicate logs removed
      dutyStatusList = await removeDuplicateConsecutiveLogss(dutyStatusList);

      // Sort the altered array
      dutyStatusList.sort((a, b) => {
        const timeA = parseInt(a.eventTime, 10);
        const timeB = parseInt(b.eventTime, 10);
        return timeA - timeB;
      });
    }
    return dutyStatusList;
  };
  sortingDateTime = (array) => {
    array.sort((a, b) => {
      const dateA = a.eventDate;
      const dateB = b.eventDate;
      const timeA = a.eventTime;
      const timeB = b.eventTime;

      // First, compare based on eventDate
      const dateComparison = dateA.localeCompare(dateB);

      // If eventDate is the same, compare based on eventTime
      if (dateComparison === 0) {
        return timeA.localeCompare(timeB);
      }

      return dateComparison;
    });
    return array;
  };

  // get next log itrarting on intermediate
  getNextIndex = (index, dutyStatusListLengthBeforeEdit, dutyStatusList) => {
    let drIn = index;
    if (dutyStatusList[index + 1].eventType == '2') {
      for (let sub = index; sub < dutyStatusListLengthBeforeEdit; sub++) {
        if (dutyStatusList[sub + 1].eventType == '2') {
          drIn++;
        } else break;
      }
    }
    return drIn + 1;
  };
  // get previous log itrarting on intermediate
  getPrevIndex = (index, dutyStatusListLengthBeforeEdit, dutyStatusList) => {
    let drIn = index;
    if (dutyStatusList[index - 1].eventType == '2') {
      for (let sub = index; sub > 0; sub--) {
        if (dutyStatusList[sub - 1].eventType == '2') {
          drIn--;
        } else break;
      }
    }
    return drIn - 2;
  };
  /**
   * The function has two main duties
   * 1. SWITCH | Make intermediate log on or off
   * 2. CHANGE INTERMEDIATE TYPE | changing intermediate type to see wheather the intermediates belong to DR, PC or YM
   */
  switchIntermediateAndChangeIntermediateType = async (
    payloadLog,
    dutyStatusList,
    index,
    nextIndex,
  ) => {
    const editableEventCodes = [];
    if (
      payloadLog.eventType == '1' &&
      dutyStatusList[index].eventType == '1' &&
      payloadLog.eventType == dutyStatusList[index].eventType &&
      payloadLog.eventCode != dutyStatusList[index].eventCode &&
      nextIndex != undefined
    ) {
      for (let i = index + 1; i < nextIndex; i++) {
        if (dutyStatusList[i].eventType == '2') {
          if (
            payloadLog.eventType == '1' &&
            editableEventCodes.includes(payloadLog.eventCode)
          ) {
            dutyStatusList[i].eventRecordStatus = '2';
          } else {
            dutyStatusList[i].eventRecordStatus = '1';
          }
          dutyStatusList[i].intermediateType = await getIntermediateType(
            payloadLog,
          );
        }
      }
    } else if (
      payloadLog.eventType == '3' &&
      dutyStatusList[index].eventType == '3' &&
      payloadLog.eventType == dutyStatusList[index].eventType &&
      payloadLog.eventCode != dutyStatusList[index].eventCode &&
      nextIndex != undefined
    ) {
      for (let i = index + 1; i < nextIndex; i++) {
        if (dutyStatusList[i].eventType == '2') {
          dutyStatusList[i].intermediateType = await getIntermediateType(
            payloadLog,
          );
        }
      }
    } else if (
      payloadLog.eventType != dutyStatusList[index].eventType &&
      nextIndex != undefined
    ) {
      for (let i = index + 1; i < nextIndex; i++) {
        if (dutyStatusList[i].eventType == '2') {
          if (
            payloadLog.eventType == '1' &&
            editableEventCodes.includes(payloadLog.eventCode)
          ) {
            dutyStatusList[i].eventRecordStatus = '2';
          } else {
            dutyStatusList[i].eventRecordStatus = '1';
          }
          dutyStatusList[i].intermediateType = await getIntermediateType(
            payloadLog,
          );
        }
      }
    } else if (nextIndex == undefined) {
      // for ongoing status
      for (let i = index + 1; i < dutyStatusList.length; i++) {
        if (dutyStatusList[i].eventType == '2') {
          if (
            payloadLog.eventType == '1' &&
            editableEventCodes.includes(payloadLog.eventCode)
          ) {
            dutyStatusList[i].eventRecordStatus = '2';
          } else {
            dutyStatusList[i].eventRecordStatus = '1';
          }
          console.log(
            `<<<<<<<<<<<<>>>>>>>>>>>>>>`,
            await getIntermediateType(payloadLog),
          );
          dutyStatusList[i].intermediateType = await getIntermediateType(
            payloadLog,
          );
        }
      }
    }

    return dutyStatusList;
  };
  /**
   * Update edit request status
   * @description : Updates the key in edit request and indicates either driver is informed about the edit/insert request in logs or not!
   */
  updateNotificationStatus = async (driverId, notificationStatus, dateTime) => {
    console.log({
      driverId: driverId,
      dateTime: `${dateTime}`,
      isApproved: 'pending',
    });

    const isUpdated = await this.editInsertLogModel.findOne({
      driverId: driverId,
      dateTime: dateTime,
      isApproved: 'pending',
    });

    if (isUpdated) {
      isUpdated.requestStatus = notificationStatus;
      await isUpdated.save();
      return true;
    } else {
      return false;
    }
  };

  generateCsvImages = async (data) => {
    const imageStrings = {};
    const responseArr = [];
    let obj;

    const isEdit = await this.editInsertLogModel.find({
      driverId: data.id,
      isApproved: 'pending',
    });
    if (!isEdit) {
      return {
        statusCode: 200,
        message: 'Edit request not found!',
        data: {},
      };
    }

    /* The above code is a TypeScript loop that iterates over an array called `isEdit`. */
    for (let i = 0; i < isEdit.length; i++) {
      const unixDateTime = isEdit[i].dateTime;
      const DateOfEdit = moment
        .unix(Number(unixDateTime))
        .tz(data.homeTerminalTimeZone.tzCode);
      console.log(
        DateOfEdit.format('YYYY-MM-DDTHH:mm:ss.SSSZ') +
          '------------- This is the logs Date',
      );
      console.log(
        isEdit[i].editDate +
          '------------- This is the Date correction is requested',
      );

      obj = {
        driverId: data.id,
        tenantId: data.tenantId,
        date: DateOfEdit.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      };

      /* The above code is declaring two variables, `csvBeforeUpdate` and `csvAfterUpdate`, and
     assigning them values from the `csv` properties of the `csvBeforeUpdate` and `csvAfterUpdate`
     objects within the `isEdit` array at index `i`. */
      const csvBeforeUpdate = isEdit[i].csvBeforeUpdate.csv;
      const csvAfterUpdate = isEdit[i].csvAfterUpdate.csv;

      imageStrings['csvBeforeUpdate'] = await this.convertToImage(
        obj,
        csvBeforeUpdate,
      );
      imageStrings['csvAfterUpdate'] = await this.convertToImage(
        obj,
        csvAfterUpdate,
      );

      responseArr.push({
        dateTime: isEdit[i].dateTime,
        date: isEdit[i].editDate,
        csvBeforeUpdate: imageStrings['csvBeforeUpdate']
          ? imageStrings['csvBeforeUpdate']
          : '',
        csvAfterUpdate: imageStrings['csvAfterUpdate']
          ? imageStrings['csvAfterUpdate']
          : '',
      });
    }

    return {
      statusCode: 200,
      message: 'Image conversion success!',
      data: responseArr,
    };
  };

  /**
   * @author:  Farzan
   *
   * @description: The function will call message pattern from reports service to create a pdf
   */
  convertToImage = async (data, csv) => {
    try {
      const requestParams = {
        tenantId: data.tenantId,
        driverId: data.driverId,
        dateStart: data.date,
        csv: csv,
      };

      const messagePatternReport = await firstValueFrom(
        this.reportClient.send({ cmd: 'edit_Report' }, requestParams),
      );
      if (messagePatternReport.isError) {
        Logger.log(`Error while finding create pdf message pattern`);
        mapMessagePatternResponseToException(messagePatternReport);
      }

      return messagePatternReport.data;
    } catch (error) {
      throw error;
    }
  };
}
