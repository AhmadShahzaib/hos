import { LoginLogoutLog } from './../logs/types';
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
import { LogsDocumentContentsType } from 'logs/types';
import moment, { invalid } from 'moment-timezone';
import { BaseHOSStatusEntity } from 'logs/base/BaseHOSStatusEntity';
import {
  dateRangeForDriverLog,
  formatCommonKeys,
  formatGraphData,
  markViolations,
} from 'shared/utils';
const ObjectId = mongoose.Types.ObjectId;
import { groupBy, mapValues, update } from 'lodash';
import { LogActionType, StatusKey } from 'logs/Enums';
import { LogsController } from 'controllers/logs.controller';
import DriverLiveLocationDocument from 'mongoDb/document/driverLiveLocation.document';
import HistoryDocument from 'mongoDb/document/history.document';
import EditInsertLogsDocument from 'mongoDb/document/editInsertLogsDocument';
import { duplicateAndModifyDutyStatus } from 'utils/duplicateAndModifyDutyStatus';
import {
  removeDuplicateConsecutiveLogs,
  removeDuplicateConsecutiveLogss,
} from 'utils/removeDuplicateConsecutiveLogs';
import { getIntermediateType } from 'utils/getIntermediateType';

@Injectable({ scope: Scope.DEFAULT  })
export class AppService {
  private readonly logger = new Logger('HOSStatusService');

  constructor(
    @InjectModel('driverLogs') private driverLogsModel: Model<LogsDocument>,
    @InjectModel('logEditRequestHistory')
    private logEditRequestHistoryModel: Model<LogEditRequestHistoryDocument>,
    @InjectModel('EditInsertLogs')
    private editInsertLogModel: Model<EditInsertLogsDocument>,
    @InjectModel('driverLiveLocation')
    private driverLiveLocationModel: Model<DriverLiveLocationDocument>,
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

  // crud operations below.

  addToDB = async (data: LogsDocumentContentsType) => {
    try {
      const logsEntry = await this.driverLogsModel.create(data);
      return logsEntry;
    } catch (error) {
      throw error;
    }
  };
  getEldOnDeviceId = async (eldId) => {
    let messagePatternDevice = await firstValueFrom<MessagePatternResponseType>(
      this.deviceClient.send({ cmd: 'get_device_by_id' }, eldId),
    );

    if (messagePatternDevice.isError) {
      Logger.log(`Error while finding eld against eldId`);
      mapMessagePatternResponseToException(messagePatternDevice);
    }

    return messagePatternDevice;
  };
  updateInDB = async (
    data: LogsDocumentContentsType,
    id: string,
    doPush: boolean = false,
  ): Promise<any> => {
    try {
      let options;
      if (doPush) {
        const logs = [...data.logs];
        delete data.logs;
        options = { ...data, $push: { logs: { $each: logs } } };
      } else {
        options = data;
      }
      const logsEntry = await this.driverLogsModel.findByIdAndUpdate(
        id,
        options,
        {
          new: true,
        },
      );
      return logsEntry;
    } catch (error) {
      throw error;
    }
  };

  findDbEntry = async (
    options: FilterQuery<LogsDocument>,
    projection: ProjectionType<LogsDocument> = {},
    mongooseOptn?: QueryOptions | null,
  ): Promise<LogsDocument> => {
    try {
      return await this.driverLogsModel.findOne(
        options,
        projection,
        mongooseOptn,
      );
    } catch (error) {
      throw error;
    }
  };

  /** THIS FUNCTION IS NOT BEING UTILIZED DUE TO CURRENT DEPENDENCY OF FETCH REQUEST **/
  // findDbEntryNew = async (
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

  updateLastKnownLocation = async (
    options: FilterQuery<LogsDocument>,
    lastKnownLocation: LastKnownLocationRequest,
  ) => {
    try {
      return await this.driverLogsModel.findOneAndUpdate(
        options,
        lastKnownLocation,
        { new: true },
      );
    } catch (error) {
      throw error;
    }
  };

  findLogListing = async (
    options: FilterQuery<LogsDocument>,
    queryParam: ListingParams,
  ): Promise<any> => {
    try {
      let logs = {};
      const { limit, pageNo, search } = queryParam;
      const dateRangeQuery = dateRangeForDriverLog(
        options.startDate,
        options.endDate,
      );
      let searchAble = {};
      if (search) {
        searchAble = {
          $or: [
            {
              'driver.firstName': {
                $regex: `.*${search}.*`,
                $options: 'i',
              },
            },
            {
              'driver.lastName': {
                $regex: `.*${search}.*`,
                $options: 'i',
              },
            },
          ],
        };
      }
      let query = {
        'driver.tenantId': new mongoose.Types.ObjectId(options.tenantId),
        logs: {
          $elemMatch: {
            actionType: { $exists: true, $nin: ['LOGIN', 'LOGOUT'] },
          },
        },
        ...dateRangeQuery,
        isActive: true,
        ...searchAble,
      };
      let logsCount = await this.driverLogsModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
        { $count: 'count' },
      ]);
      logs['count'] = logsCount.length > 0 ? logsCount[0].count : 0;
      const limitValue: number =
        limit && limit.toString().toLowerCase() === 'all'
          ? logsCount[0].count ?? 1
          : Number(limit ?? 10) ?? 10;

      logs['data'] = await this.driverLogsModel
        .aggregate([
          {
            $match: {
              ...query,
            },
          },
          {
            $group: {
              _id: {
                driverId: '$driver.id',
                calendarDate: '$lastEntry.actionDate',
              },
              calendarStartDate: {
                $first: '$calendarStartDate',
              },
              firstName: {
                $first: '$driver.firstName',
              },
              lastName: {
                $first: '$driver.lastName',
              },
              logDocumentId: {
                $first: '$_id',
              },
            },
          },
          {
            $sort: {
              '_id.calendarDate': -1,
            },
          },
          {
            $skip: ((pageNo ?? 1) - 1) * (limitValue ?? 10),
          },
          {
            $limit: limitValue ?? 10,
          },
        ])
        .exec();
      return logs;
    } catch (error) {
      throw error;
    }
  };

  findDriverAndUpdateLogs = async (data: LoginLogoutLog) => {
    try {
      const messagePatternVehicle =
        await firstValueFrom<MessagePatternResponseType>(
          this.client.send({ cmd: 'get_vehicle_by_id' }, data.vehicleId),
        );
      if (messagePatternVehicle.isError) {
        mapMessagePatternResponseToException(messagePatternVehicle);
      }
      data.vehicleManualId = messagePatternVehicle.data.vehicleId;
      data['serverDate'] = moment().unix();
      const result = await this.driverLogsModel.findOneAndUpdate(
        { $and: [{ 'driver.id': data.driverId }, { isActive: true }] },
        { $push: { logs: data } },
        { new: true },
      );
      if (!result) {
        await this.driverLogsModel.create({
          'driver.id': data.driverId,
          'driver.firstName': data.firstName,
          'driver.lastName': data.lastName,
          'driver.tenantId': data.tenantId,
          tenantId: data.tenantId,
          calendarStartDate: moment().unix(),
          logs: [data],
        });
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  findDbEntryParam = async (
    options: FilterQuery<LogsDocument>,
    queryParam: ListingParams,
  ): Promise<any> => {
    try {
      const dateRange = dateRangeForDriverLog(
        options.date.gte,
        options.date.lte,
      );
      const { limit, orderType, orderBy, pageNo } = queryParam;
      const defaultOrder = 'actionDate';
      let total: any = await this.count(options);
      const order: any = { [orderBy ?? defaultOrder]: Number(orderType ?? -1) };

      const limitValue: number =
        limit && limit.toString().toLowerCase() === 'all'
          ? total[0]?.count ?? 1
          : Number(limit ?? 10) ?? 10;

      return await this.driverLogsModel
        .aggregate([
          {
            $match: {
              'driver.id': new mongoose.Types.ObjectId(options.driverId),
            },
          },
          {
            $match: {
              ...dateRange,
            },
          },
          {
            $unwind: {
              path: '$logs',
            },
          },
          {
            $replaceRoot: {
              newRoot: '$logs',
            },
          },
          {
            $match: {
              actionDate: {
                $gte: options.date.gte,
                $lte: options.date.lte,
              },
            },
          },
          {
            $sort: order,
          },
          {
            $skip: ((pageNo ?? 1) - 1) * (limitValue ?? 10),
          },
          {
            $limit: limitValue ?? 10,
          },
        ])
        .exec();
    } catch (error) {
      throw error;
    }
  };
  getLogEntriesFromDb = async (
    aggregationArray: PipelineStage[],
  ): Promise<any> => {
    try {
      return await this.driverLogsModel.aggregate(aggregationArray).exec();
    } catch (error) {
      throw error;
    }
  };

  count = async (options: FilterQuery<LogsDocument>) => {
    const dateRange = dateRangeForDriverLog(options.date.gte, options.date.lte);
    return await this.driverLogsModel.aggregate([
      {
        $match: {
          'driver.id': new mongoose.Types.ObjectId(options.driverId),
        },
      },
      {
        $match: dateRange,
      },
      {
        $unwind: {
          path: '$logs',
        },
      },
      {
        $replaceRoot: {
          newRoot: '$logs',
        },
      },
      {
        $match: {
          actionDate: {
            $gte: options.date.gte,
            $lte: options.date.lte,
          },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
  };
  findLatestEntry = async (
    options: FilterQuery<LogsDocument>,
  ): Promise<LogsDocument> => {
    try {
      return this.driverLogsModel
        .findOne(options)
        .sort({
          updatedAt: -1,
        })
        .exec();
    } catch (error) {
      throw error;
    }
  };

  getLogsFromDb = async (
    options: FilterQuery<LogsDocument>,
    startOfRange: number,
    endOfRange: number,
    groupRecords: Boolean = false,
    includeAllLogs: Boolean = false,
  ): Promise<any[]> => {
    try {
      const dateRangeQuery = dateRangeForDriverLog(startOfRange, endOfRange);
      const driverLogsFieldsToIncludeInResponse = {
        actionDate: '$doc.actionDate',
        odoMeterMillage: '$doc.odoMeterMillage',
        odoMeterSpeed: '$doc.odoMeterSpeed',
        engineHours: '$doc.engineHours',
        vehicleManualId: '$doc.vehicleManualId',
        geoLocation: '$doc.geoLocation',
        appVersion: '$doc.appVersion',
        deviceVersion: '$doc.deviceVersion',
        notes: '$doc.notes',
        driver: '$doc.driver',
        id: '$doc._id',
        violations: '$doc.violations',
        deviceType: '$doc.deviceType',
        OSversion: '$doc.OSversion',
        annotation: '$doc.annotation',
        editRequest: '$doc.editRequest',
        updated: '$doc.updated',
        isManual: '$doc.isManual',
        lastKnownLocation: '$doc.lastKnownLocation',
        eventType: '$doc.eventType',
        actionType: '$doc.actionType',
        sequenceNumber: '$doc.sequenceNumber',
        deviceModel: '$doc.deviceModel',
        eldType: '$doc.eldType',
      };

      let logEntriesConditions: QueryOptions = {
        $or: [
          {
            $and: [
              {
                'status.v.startTime': {
                  $exists: true,
                },
              },
              {
                'status.v.lastStartedAt': {
                  $exists: true,
                },
              },
            ],
          },
          {
            'doc.isManual': { $exists: true },
          },
        ],
      };
      if (includeAllLogs) {
        logEntriesConditions['$or'].push(
          {
            'doc.eventType': { $exists: true },
          },
          {
            'doc.actionType': {
              $exists: true,
              $in: ['LOGIN', 'LOGOUT'],
            },
          },
        );
      }
      const query: PipelineStage[] = [
        {
          $match: {
            ...options,
          },
        },
        {
          $unwind: {
            path: '$logs',
          },
        },
        {
          $match: {
            ...dateRangeQuery,
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ driver: '$driver' }, '$logs'],
            },
          },
        },
        {
          $project: {
            _id: 0,
            offDuty: '$statusesData.offDuty',
            onDuty: '$statusesData.onDuty',
            onDriving: '$statusesData.onDriving',
            onSleeperBerth: '$statusesData.onSleeperBerth',
            onYardMove: '$statusesData.onYardMove',
            onPersonalConveyance: '$statusesData.onPersonalConveyance',
            doc: '$$ROOT',
          },
        },
        {
          $project: {
            actionDate: '$actionDate',
            status: {
              $arrayElemAt: [
                {
                  $objectToArray: '$$ROOT',
                },
                0,
              ],
            },
            doc: '$doc',
          },
        },
        {
          $match: {
            ...logEntriesConditions,
            // $or: [...logEntriesConditions]
            // {
            //   $and: [
            //     {
            //       "status.v.startTime": {
            //         $exists: true,
            //       }
            //     },
            //     {
            //       "status.v.lastStartedAt": {
            //         $exists: true,
            //       }
            //     }
            //   ],
            // },
            // {
            //   'doc.isManual': { $exists: true },
            // },
            // {
            //   'doc.eventType': { $exists: true },
            // },
            // {
            //   "doc.actionType": {
            //     $exists: true, $in: ['LOGIN', 'LOGOUT']
            //   }
            // }
            // ],
          },
        },
        {
          $project: {
            status: '$status.k',
            startTime: '$status.v.startTime',
            lastStartedAt: '$status.v.lastStartedAt',
            totalSecondsSpentSoFar: {
              $subtract: ['$status.v.lastStartedAt', '$status.v.startTime'],
            },
            ...driverLogsFieldsToIncludeInResponse,
          },
        },
      ];
      if (groupRecords) {
        query.push({
          $group: {
            _id: '$status',
            totalSecondsSpentSoFarInLastEightDays: {
              $sum: '$totalSecondsSpentSoFar',
            },
          },
        });
      }
      this.logger.debug('getLogsFromDb', JSON.stringify(query));
      return await this.driverLogsModel.aggregate(query).exec();
    } catch (error) {
      throw error;
    }
  };

  getLatestLogObject = async (driver, date: string, timeZone: string) => {
    let latestLog;
    const { start: startOfDay, end: endOfDay } = getTimeZoneDateRangeForDay(
      date,
      timeZone,
    );

    let options: FilterQuery<LogsDocument> = {
      'driver.id': new mongoose.Types.ObjectId(driver.driverId),
      isActive: true,
    };
    let pipeline: PipelineStage[] = [
      {
        $match: {
          ...options,
        },
      },
      {
        $unwind: {
          path: '$logs',
        },
      },
      {
        $match: {
          $and: [
            {
              'logs.actionType': {
                $nin: ['LOGIN', 'LOGOUT'],
              },
            },
            {
              'logs.eventType': {
                $exists: false,
              },
            },
            {
              'logs.isManual': {
                $exists: false,
              },
            },
          ],
        },
      },
      {
        $sort: {
          'logs.actionDate': -1,
        },
      },
      {
        $limit: 1,
      },
    ];
    const [data] = await this.getLogEntriesFromDb(pipeline);
    if (!data || !data.logs || data?.logs?.length <= 0) return null;

    let latestLogEntry = data.logs;
    const status = StatusKey[latestLogEntry.actionType];
    const statusValues = latestLogEntry.statusesData
      ? latestLogEntry.statusesData[status]
      : null;
    if (!latestLogEntry || !latestLogEntry.statusesData || !statusValues)
      return null;
    delete latestLogEntry.statusesData._id;
    if (
      latestLogEntry.actionDate >= startOfDay &&
      latestLogEntry.actionDate <= endOfDay &&
      !statusValues.lastStartedAt
    ) {
      const currentUnixTimeStamp = moment.tz(moment(), timeZone).unix(); // TODO: Should be according to the time-zone perhaps
      // if (latestLogEntry?.violations && latestLogEntry?.violations.length > 0) {
      //   let updatedViolations = latestLogEntry.violations.map((e) => {
      //     let obj = { ...e };
      //     if (!e.endedAt) {
      //       obj['endedAt'] = currentUnixTimeStamp;
      //     }
      //     return obj;
      //   });
      //   latestLogEntry.violations = updatedViolations;
      // }
      latestLog = {
        ...latestLogEntry,
        status,
        startTime:
          statusValues.startTime < startOfDay
            ? startOfDay
            : statusValues.startTime,
        lastStartedAt: currentUnixTimeStamp, //latestLogEntry.actionDate,
        totalSecondsSpentSoFar: currentUnixTimeStamp - statusValues.startTime,
      };
    }
    return latestLog ? formatCommonKeys(await markViolations(latestLog)) : null;
  };

  getLogs = async (
    driver,
    date: string,
    timeZone: string,
    includeAllLogs: boolean,
  ) => {
    const { start: startOfDay, end: endOfDay } = getTimeZoneDateRangeForDay(
      date,
      timeZone,
    );

    let options: FilterQuery<LogsDocument> = {
      'driver.id': new mongoose.Types.ObjectId(driver.driverId),
      isActive: true,
    };
    const data = await this.getLogsFromDb(
      options,
      startOfDay,
      endOfDay,
      false,
      includeAllLogs,
    );
    let result = [];
    return data?.length > 0 ? await formatGraphData(data) : result;
  };

  updateDataInUnits = async (data) => {
    const messagePatternFirstValue = await firstValueFrom(
      this.unitsClient.emit({ cmd: 'update_hos_data' }, data),
    );
  };
  // TODO -- need to shift this according to the companyTimZone

  getFourteenDaysData = async (
    driverId: string,
    companyTimeZone: string,
    date: string = undefined,
    requestParam = undefined,
  ) => {
    const yesterdayEnd = date
      ? moment(date).endOf('day').unix()
      : moment
          .tz(moment(), companyTimeZone)
          .subtract(1, 'days')
          .endOf('day')
          .unix();
    const startOfFourteenthDay = moment(date || new Date())
      .tz(companyTimeZone)
      .subtract(14, 'days')
      .startOf('day')
      .unix();

    const data = await this.getLogsFromDb(
      { 'driver.id': new mongoose.Types.ObjectId(driverId) },
      startOfFourteenthDay,
      yesterdayEnd,
    );
    if (date) {
      let latestObj = await this.getLatestLogObject(
        requestParam,
        date,
        companyTimeZone,
      );
      if (latestObj) data.push(latestObj);
    }
    const grouped = groupBy(data, (log) => {
      return moment
        .unix(log.actionDate)
        .tz(companyTimeZone)
        .format('YYYY-MM-DD');
    });
    const mappedData = mapValues(grouped, (logs) => {
      return logs.reduce((acc, curr) => {
        if (curr.updated?.length > 0) {
          curr.updated.forEach((c) => {
            const status =
              c.actionType === LogActionType.DRIVING ||
              c.actionType === LogActionType.ON_DUTY_NOT_DRIVING
                ? 'hoursWorked'
                : StatusKey[c.actionType];
            let currEditStatus = c.statusesData[StatusKey[c.actionType]];
            if (currEditStatus) {
              if (acc[status]) {
                acc[status].totalSecondsSpentSoFar +=
                  currEditStatus.lastStartedAt - currEditStatus.startTime;
              } else {
                acc[status] = {
                  totalSecondsSpentSoFar:
                    currEditStatus.lastStartedAt - currEditStatus.startTime,
                };
              }
            }
          });
          return acc;
        } else {
          const status =
            curr.status === 'onDriving' || curr.status === 'onDuty'
              ? 'hoursWorked'
              : curr.status;
          if (acc[status]) {
            acc[status].totalSecondsSpentSoFar += curr.totalSecondsSpentSoFar;
          } else {
            acc[status] = {
              totalSecondsSpentSoFar: curr.totalSecondsSpentSoFar,
            };
          }
          return acc;
        }
      }, {});
    });
    return mappedData;
  };

  /**
   * To update the logs on nested level
   * @param query to filter the main document i.e. date etc
   * @param update updated log for logs array
   * @param options nested level query filters
   * @returns
   */
  findAndUpdateDriverLogsInDB = async (
    query: FilterQuery<LogsDocument>,
    update: FilterQuery<LogsDocument>,
    options: FilterQuery<LogsDocument>,
  ): Promise<LogsDocument> => {
    try {
      const result = await this.driverLogsModel.findOneAndUpdate(
        query,
        update,
        options,
      );
      if (!result) {
        Logger.log(`Requested log entry not found ${query['logs._id']}`);
        throw new NotFoundException(`${query['logs._id']} Not found`);
      }
      return result;
    } catch (error) {
      Logger.log(`Error while performing action: ${error}`);
      throw error;
    }
  };

  addEditLogRequestHistory = async (data, user, editedDay, requestStatus) => {
    try {
      const { id, tenantId, firstName, lastName, vehicleId } = data.driver;
      let driverObject = {
        id: id,
        tenantId: tenantId,
        firstName: firstName,
        lastName: lastName,
        vehicleId: vehicleId,
      };
      let dataToBeSaved = {
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

  /**
   * driver live location - V2
   * Author : Farzan
   */
  addLiveLocation = async (obj) => {
    const driverLiveLocationTrackable =
      await this.driverLiveLocationModel.findOne({
        driverId: obj?.driverId,
      });
    if (driverLiveLocationTrackable) {
      for (let i = 0; i < obj.sortedArray.length; i++) {
        const historyOfLocation = obj.sortedArray[i]?.historyOfLocation;
        historyOfLocation.meta = {};
        driverLiveLocationTrackable.historyOfLocation.push(historyOfLocation);
      }

      await driverLiveLocationTrackable.save();
    } else {
      await this.driverLiveLocationModel.create([obj]);
      const firstTimeLocation = await this.driverLiveLocationModel.findOne({
        driverId: obj?.driverId,
      });
      if (firstTimeLocation) {
        for (let i = 0; i < obj.sortedArray.length; i++) {
          const historyOfLocation = obj.sortedArray[i]?.historyOfLocation;
          historyOfLocation.meta = {};
          firstTimeLocation.historyOfLocation.push(historyOfLocation);
        }

        await firstTimeLocation.save();
      }
    }
    return {
      statusCode: 200,
      message: 'Live location updated successfully!',
      data: driverLiveLocationTrackable?.historyOfLocation
        ? driverLiveLocationTrackable?.historyOfLocation
        : [obj?.historyOfLocation],
    };
  };

  /**
   * driver live location  : GET- V2
   * Author : Farzan
   */
  getLiveLocation = async (obj) => {
    let query;

    if (obj?.time && obj?.date == null) {
      query = {
        driverId: `${obj?.driverId}`,
        'historyOfLocation.time': `${obj?.time}`,
      };
    } else if (obj?.date && obj?.time == null) {
      query = {
        driverId: `${obj?.driverId}`,
        'historyOfLocation.date': `${obj?.date}`,
      };
    } else if (obj?.time && obj?.date) {
      query = {
        driverId: `${obj?.driverId}`,
        'historyOfLocation.time': `${obj?.time}`,
        'historyOfLocation.date': `${obj?.date}`,
      };
    } else {
      query = {
        driverId: obj?.driverId,
      };
    }

    let driverLiveLocationTrackable =
      await this.driverLiveLocationModel.aggregate(
        [
          // Unwind the array field to deconstruct the array elements
          { $unwind: '$historyOfLocation' },
          // Match only the documents that have an object in the array with myField equal to "specificValue"
          {
            $match: query,
          },
          // Group the results by _id to reconstruct the array field
          {
            $group: {
              _id: '$_id',
              historyOfLocation: { $push: '$historyOfLocation' },
              // Add other fields that you want to include in the results
            },
          },
        ],
        function (err, docs) {
          if (err) {
            return err;
          }
        },
      );
    if (driverLiveLocationTrackable.length == 0) {
      return {
        statusCode: 200,
        message: 'No live locations available!',
        data: [],
      };
    }

    driverLiveLocationTrackable =
      driverLiveLocationTrackable[0]?.historyOfLocation;
    return {
      statusCode: 200,
      message: 'Live location fetched successfully!',
      data: driverLiveLocationTrackable,
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
      let id = queryParams.id;
      where = {
        ...where,
        dateTime: dateTime,
        driverId: id,
      };
    } else {
      selectableString = 'csvBeforeUpdate csvAfterUpdate';
      let id = queryParams.id;
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
    let id = queryParams.id;
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

    let logs = response.filter((element) => {
      let dateOfLogs = moment
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
    let inActiveLogs = dutyStatusList.filter(
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
                let drIn = this.getPrevIndex(
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
            let item = dutyStatusList[i];
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

    let isUpdated = await this.editInsertLogModel.findOne({
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
    let imageStrings = {};
    let responseArr = [];
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
      let unixDateTime = isEdit[i].dateTime;
      let DateOfEdit = moment
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
      let csvBeforeUpdate = isEdit[i].csvBeforeUpdate.csv;
      let csvAfterUpdate = isEdit[i].csvAfterUpdate.csv;

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

      let messagePatternReport = await firstValueFrom(
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
