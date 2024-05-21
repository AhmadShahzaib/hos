import {
  BaseController,
  getTimeZoneDateRangeForDay,
  ListingParams,
  ListingParamsValidationPipe,
  mapMessagePatternResponseToException,
  MessagePatternResponseInterceptor,
  MessagePatternResponseType,
  MongoIdValidationPipe,
  SocketManagerService,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import mongoose from 'mongoose';

import moment from 'moment-timezone';
import {
  Controller,
  Param,
  Inject,
  Body,
  Query,
  Res,
  Headers,
  Logger,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  Req,
  Put,
  Post,
  Get,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import AddLogEntryDecorators from 'decorators/addLogEntryDecorators';
import EditLogEntryDecorators from 'decorators/editLogEntryDecorators';
import approveOrRejectEditRequestDecorator from 'decorators/approveOrRejectEditRequestDecorator';
import liveLocationHistory from 'decorators/liveLocationHistory';
import pendingEditRequestDecorator from 'decorators/pendingEditRequestDecorator';
import LocationUpdate from 'decorators/lastKnownLocationDecorators';
import GetDriverHistoryDecorators from 'decorators/getDriverHistory';
import GetDriverLiveDataDecorators from 'decorators/getDriverLiveData';
import GetGraphDataDecorators, {
  GetDriverGraphDataDecorators,
} from 'decorators/getGraphData';
import { Response, Request } from 'express';
import { mapKeys, camelCase } from 'lodash';
import LogsDocument from 'mongoDb/document/document';
import { LogsService } from 'services/logs.service';
import { DriverCsvService } from 'services/driverCsv.service';

import { AppService } from '../services/app.service';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import { LastKnownLocationRequest } from 'models/lastKnownLocation';
import GetMyLiveDataDecorators from 'decorators/getMyLiveData';
import GetDriverLiveDataUptoNow from 'decorators/getDriverLiveDataUptoNow';
import { getAddress } from 'services/addresses.cron';
import { GraphDataType } from 'models/GraphData.type';
import { DriverLiveData } from 'models/liveData.response.model';
import { LogEntryResponseModel } from 'models/logEntry.response.model';
import {
  ClientProxy,
  EventPattern,
  MessagePattern,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import GetFourteenDaysRecapDecorators, {
  GetFourteenDaysRecapDecoratorsMobile,
} from 'decorators/getFourteenDaysRecapDecorators';
import GetAllDriverLogDecorators from 'decorators/getLogListing';
import { AllDriverLogResponseModel } from 'models/allDriverLogs.response.model';
import {
  GetClockDataDecoratorBackOffice,
  GetClockDataDecoratorDriver,
} from 'decorators/getClockDataDecorator';
// import { firstValueFrom } from 'rxjs';
import { FilterQuery } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import EditInsertLogsDocument from 'mongoDb/document/editInsertLogsDocument';
import { Model } from 'mongoose';
import GetDriverHistoryByParamDecorators from 'decorators/getDriverHistoryByParam';
import GetEditLogHistory from 'decorators/getEditLogHistoryDecorator';
import MobileCorrectionDecorators from 'decorators/MobileCorrectionDecorators';

import { DriverLiveLocationDto } from 'dto/driverLiveLocation.dto';
import FetchDriverLiveLocation from 'decorators/fetchDriverLiveLocationDecorator';
import { FetchDriverLiveLocationDto } from 'dto/fetchDriverliveLocation.dto';
import { dispatchNotification } from 'utils/dispatchNotification';
import GetMaintainedHistoryDecorator from 'decorators/getMaintainedHistoryDecorator';
import GetOrignalLogDecorator from 'decorators/GetOrignalLogDecorator';
import { UnidentifiedLogsService } from '../services/unidentifiedLogs.service';
import specificDaytrip from 'decorators/specificDaytripDecorators';
import specificDaytripDecorators from 'decorators/specificDaytripDecorators';
import performEditOnLogsDecorator from 'decorators/performEditOnLogsDecorator';
import { duplicateAndModifyDutyStatus } from 'utils/duplicateAndModifyDutyStatus';
import { removeDuplicateConsecutiveLogss } from 'utils/removeDuplicateConsecutiveLogs';
import notifyDriverAboutCorrection from 'decorators/notifyDriverAboutCorrection';
import { updateLogform } from 'utils/updateLogform';
import mobileCorrectionDecoratorsUnidenfied from 'decorators/mobileCorrectionDecoratorsUnidenfied';
import { calculateAccumulatedMiles } from 'utils/accumolatedMiles';
import { sortLiveLocations } from 'utils/sortLiveLocations';

@Controller('HOS')
@ApiTags('HOS')
export class AppController extends BaseController {
  private readonly logger = new Logger('HOS App Controller');
  private readonly snakeCaseMapper = (val) =>
    mapKeys(val, (v, k) => {
      return camelCase(k);
    });
  constructor(
    private readonly socketManager: SocketManagerService,
    @Inject('UnidentifiedLogsService')
    private readonly unidetifiedLogsService: UnidentifiedLogsService,
    @Inject('AppService') private readonly HOSService: AppService,
    @Inject('LogsService') private readonly logService: LogsService,
    @Inject('DriverCsvService')
    private readonly driverCsvService: DriverCsvService,
    @Inject('DRIVER_SERVICE') private readonly driverClient: ClientProxy,
    @Inject('PUSH_NOTIFICATION_SERVICE')
    private readonly pushNotificationClient: ClientProxy,
    @Inject('COMPANY_SERVICE') private readonly companyClient: ClientProxy,
    @Inject('UNIT_SERVICE') private readonly unitClient: ClientProxy,
    @Inject('DEVICE_SERVICE') private readonly deviceClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
    private readonly gateway: WebsocketGateway,
  ) {
    super();
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @GetDriverLiveDataDecorators()
  async GetDriverLiveData(
    @Param('id') driverId: string,
    @Headers('Authorization') authToken: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      const driver = (request.user as any) ?? { tenantId: undefined };
      // const liveDriverData = await getLiveDriverData(
      //   driverId,
      //   this.HOSService,
      //   driver.companyTimeZone,
      // );
      // let responseData;
      // if (liveDriverData.length > 0) {
      //   responseData = new DriverLiveData(liveDriverData[0], liveDriverData[1]);
      // }
      // const [liveDriverData] = await Promise.all(promises);
      let responseData;
      // if (liveDriverData.length > 0) {
      //   responseData = new DriverLiveData(liveDriverData[0], liveDriverData[1]);
      responseData = await this.HOSService.getUnitData(driverId);
      // }
      // add google api here and calculate address of otherThenDriving statuses

      let address = await this.driverCsvService.getAddress(
        responseData?.lastKnownLocation?.latitude,
        responseData?.lastKnownLocation?.longitude,
      );
      if (address != '') {
        responseData.lastKnownLocation.address = address;
      }
      return response.status(200).send({
        message: 'Success',
        data: responseData?.meta || {},
      });
    } catch (error) {
      throw error;
    }
  }

  @GetMyLiveDataDecorators()
  async getMyLiveData(
    @Headers('Authorization') authToken: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      // const tokenPayload: JwtPayload = await this.socketManager.validateToken(
      //   authToken.split(' ')[1],
      // );
      // const driver = JSON.parse(tokenPayload.sub);
      const driver = (request.user as any) ?? { tenantId: undefined };
      // const promises = [];
      // promises.push(
      //   getLiveDriverData(driver.id, this.HOSService, driver.companyTimeZone),
      // );
      // const [liveDriverData] = await Promise.all(promises);
      let responseData;
      // if (liveDriverData.length > 0) {
      //   responseData = new DriverLiveData(liveDriverData[0], liveDriverData[1]);
      responseData = await this.HOSService.getUnitData(driver.id);
      // }
      return response.status(200).send({
        message: 'Success',
        data: responseData.meta || [],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Edit Logs - V2
   * Author : Farzan
   */
  @EditLogEntryDecorators()
  async EditInsertLogEntry(
    @Body() data,
    @Headers('Authorization') authToken: string,
    @Res() response,
    @Req() request,
  ) {
    try {
      let user;
      const logs = data?.logs;
      let trailerNumber;
      /**
       *  Extract deviceToken from request body
       */
      const parsedToken = (request.user as any) ?? { tenantId: undefined };

      let messagePatternDriver;
      if (parsedToken.isDriver) {
        user = parsedToken;
      } else {
        messagePatternDriver = await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, data?.driverId),
        );
        if (messagePatternDriver?.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver?.data;
        user.companyTimeZone = parsedToken.companyTimeZone;
      }

      /**
       * Unix time when edit was performed comment
       */

      const dateTime = moment
        .tz(logs.date, user?.homeTerminalTimeZone?.tzCode)
        .unix();
      data.dateTime = dateTime;
      data.editDate = moment.unix(dateTime).format('YYYY-MM-DD');
      data.requestStatus = 'pending';

      data.editedBy = {
        id: parsedToken._id ? parsedToken._id : parsedToken.id,
        name: parsedToken.fullName
          ? parsedToken.fullName
          : `${parsedToken.firstName} ${parsedToken.lastName}`,
        role: parsedToken.isDriver == true ? 'driver' : 'Admin',
      };
      data.type = 'correction';

      // Get Original Csv
      const date = data?.logs?.date;
      var query = {
        start: date,
        end: date,
      };
      const driverCsv = await this.driverCsvService.getGraphFromDB(query, user);

      if (driverCsv.length < 1) {
        return response.status(200).send({
          statusCode: 200,
          message: 'Please login from mobile first!',
          data: {},
        });
      }

      const driverCsvAfter = JSON.parse(JSON.stringify(driverCsv));

      data.csvBeforeUpdate = {
        csv: driverCsv[0].csv,
        voilations: driverCsv[0].meta?.voilations,
      };
      data.csvAfterUpdate = {
        csv: {},
        voilations: [],
      };
      let dutyStatusList = JSON.parse(
        JSON.stringify(
          driverCsv[0].csv['eldEventListForDriversRecordOfDutyStatus'],
        ),
      );

      // If edit req is already created
      const isEdit = await this.logService.isEditInsertReqExists(
        data.dateTime,
        data.driverId,
      );
      if (isEdit) {
        dutyStatusList = JSON.parse(
          JSON.stringify(
            isEdit.csvAfterUpdate.csv[
              'eldEventListForDriversRecordOfDutyStatus'
            ],
          ),
        );
        trailerNumber = isEdit.trailerNumber;
      }

      // actionType = [1 == "Perform Edit", 2 == " Perform Insert"]
      if (data?.actionType == 1) {
        const updatedLogs = await this.HOSService.performEditOnLogs(
          logs,
          dutyStatusList,
        );

        // Placing updated logs in csv header
        driverCsvAfter[0].csv['eldEventListForDriversRecordOfDutyStatus'] =
          updatedLogs;

        // After edit csv duty logs and violation calculations
        data.csvAfterUpdate = {
          csv: driverCsvAfter[0].csv,
          voilations: driverCsvAfter[0].meta?.voilations,
        };
        let index = dutyStatusList.findIndex(
          (item) => item.eventSequenceIdNumber === logs.eventSequenceIdNumber,
        );
        data.lastItem = false;

        if (index == dutyStatusList.length - 1) {
          data.lastItem = true;
        }
      } else if (data.actionType == 2) {
        // Perform Insert Log
        const csv = await this.driverCsvService.inserDutyStatus(
          isEdit ? isEdit.csvAfterUpdate : driverCsv,
          logs.driverId,
          logs.date,
          logs.startTime,
          logs.endTime,
          logs.eventType,
          logs.eventCode,
          logs.eventLatitude,
          logs.eventLongitude,
          logs.address,
          logs.totalVehicleMilesDutyStatus,
          logs.totalEngineHoursDutyStatus,
          logs.truck,
          logs.shippingDocument,
          logs.trailerNumber,
          logs.notes,
          logs.state,
          user?.homeTerminalTimeZone?.tzCode,
        );
        data.csvAfterUpdate = {
          csv: csv,
          voilations: driverCsv[0].meta?.voilations,
        };
      } else if (data.actionType == 3) {
        // Get the required index, on which edit has to be performed
        const index = dutyStatusList.findIndex(
          (obj) =>
            obj.eventSequenceIdNumber === logs.eventSequenceIdNumber &&
            obj.eventRecordStatus === `1`,
        );
        if (index == -1) {
          return response.status(200).send({
            statusCode: 200,
            message: 'Invalid event sequence id!',
            data: {},
          });
        }
        dutyStatusList[index]['eventRecordStatus'] = '2';

        // Make the targeted log inactive
        // dutyStatusList = duplicateAndModifyDutyStatus(
        //   dutyStatusList[index],
        //   dutyStatusList,
        //   logs,
        //   true,
        // );

        // // Sort the altered array
        // dutyStatusList.sort((a, b) => {
        //   const timeA = parseInt(a.eventTime, 10);
        //   const timeB = parseInt(b.eventTime, 10);
        //   return timeA - timeB;
        // });

        // //Duty status list after duplicate logs removed
        // dutyStatusList = await removeDuplicateConsecutiveLogss(dutyStatusList);

        // // Sort the altered array
        // dutyStatusList.sort((a, b) => {
        //   const timeA = parseInt(a.eventTime, 10);
        //   const timeB = parseInt(b.eventTime, 10);
        //   return timeA - timeB;
        // });

        if (isEdit) {
          isEdit.csvAfterUpdate.csv[
            'eldEventListForDriversRecordOfDutyStatus'
          ] = dutyStatusList;
        } else {
          driverCsv[0].csv['eldEventListForDriversRecordOfDutyStatus'] =
            dutyStatusList;
        }

        const csv = await this.driverCsvService.inserDutyStatus(
          isEdit ? isEdit.csvAfterUpdate : driverCsv,
          logs.driverId,
          logs.date,
          logs.startTime,
          logs.endTime,
          logs.eventType,
          logs.eventCode,
          logs.eventLatitude,
          logs.eventLongitude,
          logs.address,
          logs.totalVehicleMilesDutyStatus,
          logs.totalEngineHoursDutyStatus,
          logs.truck,
          logs.shippingDocument,
          logs.tralier,
          logs.notes,
          logs.state,
          user?.homeTerminalTimeZone?.tzCode,
        );
        data.csvAfterUpdate = {
          csv: csv,
          voilations: driverCsv[0].meta?.voilations,
        };
      }
      const currentDateTime = moment();

      // Format the current date and time in the desired format
      const formattedDateTime = currentDateTime.format('MM/DD/YYYY h:mm:ss A');

      data.editDate = formattedDateTime;
      data.shippingId = logs.shippingDocumentNumber;
      data.trailerNumber = logs.trailerNumber;

      /**
       * Create edit log document along with notificationStatus
       */
      let afterAccumulated = await calculateAccumulatedMiles(data);
      const res = await this.logService.editInsertLogs(
        isEdit,
        afterAccumulated,
      );
      return response.status(res.statusCode).send(res);
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Edit Logs - V2
   * Author : Farzan
   */
  @MobileCorrectionDecorators()
  async MobileCorrectionDecorators(
    @Body() data,
    @Headers('Authorization') authToken: string,
    @Res() response,
    @Req() request,
  ) {
    try {
      let user;
      const logs = data?.logs;

      /**
       *  Extract deviceToken from request body
       */
      const parsedToken = (request.user as any) ?? { tenantId: undefined };

      if (parsedToken.isDriver) {
        user = parsedToken;
      }

      /**
       * Unix time when edit was performed
       */
      const dateTime = moment(
        moment(logs.date).format('MMDDYY'),
        'MMDDYYHHmmss',
        user?.homeTerminalTimeZone?.tzCode,
      ).unix();
      data.dateTime = dateTime;

      // Get Original Csv
      const date = data?.logs?.date;
      var query = {
        start: date,
        end: date,
      };
      const driverCsv = await this.driverCsvService.getGraphFromDB(query, user);

      if (driverCsv.length < 1) {
        return response.status(200).send({
          statusCode: 200,
          message: 'Please login from mobile first!',
          data: {},
        });
      }

      let dutyStatusList = JSON.parse(
        JSON.stringify(
          driverCsv[0].csv['eldEventListForDriversRecordOfDutyStatus'],
        ),
      );

      // actionType = [1 == "Perform Edit", 2 == " Perform Insert"]
      if (data?.actionType == 1) {
        const updatedLogs = await this.HOSService.performEditOnLogs(
          logs,
          dutyStatusList,
        );

        // Placing updated logs in csv header
        driverCsv[0].csv['eldEventListForDriversRecordOfDutyStatus'] =
          updatedLogs;
        let index = dutyStatusList.findIndex(
          (item) => item.eventSequenceIdNumber === logs.eventSequenceIdNumber,
        );
        data.lastItem = false;

        if (index == dutyStatusList.length - 1) {
          data.lastItem = true;
        }
        // After edit csv duty logs and violation calculations
      } else if (data.actionType == 2) {
        // Perform Insert Log
        const csv = await this.driverCsvService.inserDutyStatus(
          driverCsv,
          logs.driverId,
          logs.date,
          logs.startTime,
          logs.endTime,
          logs.eventType,
          logs.eventCode,
          logs.eventLatitude,
          logs.eventLongitude,
          logs.address,
          logs.odometer,
          logs.engineHour,
          logs.truck,
          logs.shippingDocument,
          logs.tralier,
          logs.notes,
          logs.state,
          user?.homeTerminalTimeZone?.tzCode,
        );
        driverCsv[0].csv = csv;
        data.lastItem = false;
      } else if (data.actionType == 3) {
        // Get the required index, on which edit has to be performed
        const index = dutyStatusList.findIndex(
          (obj) =>
            obj.eventSequenceIdNumber === logs.eventSequenceIdNumber &&
            obj.eventRecordStatus === `1`,
        );
        if (index == -1) {
          return response.status(200).send({
            statusCode: 200,
            message: 'Invalid event sequence id!',
            data: {},
          });
        }
        dutyStatusList[index]['eventRecordStatus'] = '2';

        driverCsv[0].csv['eldEventListForDriversRecordOfDutyStatus'] =
          dutyStatusList;

        const csv = await this.driverCsvService.inserDutyStatus(
          driverCsv,
          logs.driverId,
          logs.date,
          logs.startTime,
          logs.endTime,
          logs.eventType,
          logs.eventCode,
          logs.eventLatitude,
          logs.eventLongitude,
          logs.address,
          logs.odometer,
          logs.engineHour,
          logs.truck,
          logs.shippingDocument,
          logs.tralier,
          logs.notes,
          logs.state,
          user?.homeTerminalTimeZone?.tzCode,
        );
        driverCsv[0].csv = csv;
      }

      /**
       * run hos on current data.
       **/
      const res = await this.driverCsvService.addToDB(driverCsv[0], user);
      let dateOfQuery = moment(date);
      dateOfQuery = dateOfQuery.subtract(1, 'days');
      let dateQuery = dateOfQuery.format('YYYY-MM-DD');
      let queryy = {
        start: dateQuery,
        end: dateQuery,
      };
      await this.driverCsvService.runCalculationOnDateHOS(queryy, user);
      // search
      // dateOfQuery = date;

      // dateQuery = moment().format('YYYY-MM-DD');
      // queryy = {
      //   start: dateQuery,
      //   end: dateQuery,
      // };
      // const resp: any = await this.driverCsvService.getFromDB(queryy, user);
      let messagePatternDriver;

      messagePatternDriver = await firstValueFrom<MessagePatternResponseType>(
        this.driverClient.send({ cmd: 'get_driver_by_id' }, logs.driverId),
      );
      if (messagePatternDriver?.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }
      user = messagePatternDriver?.data;
      let SpecificClient = user?.client; //client
      const notificationObj = {
        logs: [],
        dateTime: dateTime,
        driverId: data?.driverId,
        editStatusFromBO: 'cancel',
        notificationType: 5,
      };
      await this.gateway.syncDriver(
        SpecificClient,
        user,
        date.format('YYYY-MM-DD'),
        notificationObj,
      );
      return response.status(200).send({});
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  @mobileCorrectionDecoratorsUnidenfied()
  async MobileCorrectionDecoratorsUnidenfied(
    @Body() data,
    @Headers('Authorization') authToken: string,
    @Res() response,
    @Req() request,
  ) {
    try {
      let user;
      const logs = data?.logs;
      let SpecificClient;
      const driverId = data?.driverId;
      const unidentified = data?.unidentified;
      const {
        eventSequenceIdNumber,
        eldNumber,
        isAccepted,
        reason,
        origin,
        destination,
      } = unidentified;
      if (isAccepted == 1 || isAccepted == 0) {
      } else {
        return response.status(422).send({
          statusCode: 422,
          message: 'Valid values to respond are either 0 or 1!',
          data: {},
        });
      }
      /**
       *  Extract deviceToken from request body
       */
      const parsedToken = (request.user as any) ?? { tenantId: undefined };

      if (parsedToken.isDriver) {
        user = parsedToken;
      }
      Logger.log(user);
      if (isAccepted == 1) {
        let startEngineHours = unidentified.startEngineHour + '';
        let endEngineHours = unidentified?.endEngineHour + '';
        let startMiles = unidentified?.startVehicleMiles + '';
        let endMiles = unidentified?.endVehicleMiles + '';
        startMiles = startMiles.split('.')[0];
        endMiles = endMiles.split('.')[0];
        startEngineHours = startEngineHours.replace(/(\.\d)\d*/, '$1');
        endEngineHours = endEngineHours.replace(/(\.\d)\d*/, '$1');

        /**
         * Unix time when edit was performed
         */
        const dateTime = moment(
          moment(logs.date).format('MMDDYY'),
          'MMDDYYHHmmss',
          user?.homeTerminalTimeZone?.tzCode,
        ).unix();
        data.dateTime = dateTime;

        // Get Original Csv
        const date = data?.logs?.date;
        var query = {
          start: date,
          end: date,
        };

        const driverCsv = await this.driverCsvService.getGraphFromDB(
          query,
          user,
        );

        if (driverCsv.length < 1) {
          return response.status(200).send({
            statusCode: 200,
            message: 'Please login from mobile first!',
            data: {},
          });
        }

        let dutyStatusList = JSON.parse(
          JSON.stringify(
            driverCsv[0].csv['eldEventListForDriversRecordOfDutyStatus'],
          ),
        );

        // actionType = [1 == "Perform Edit", 2 == " Perform Insert"]

        // Perform Insert Log
        console.log('destination address' + destination?.address);
        console.log('destination latitude' + destination?.latitude);
        console.log('destination longitude' + destination?.longitude);
        console.log('origin address' + origin?.address);
        console.log('origin latitude' + origin?.latitude);
        console.log('origin longitude' + origin?.longitude);
        console.log('destination engineHoure' + endEngineHours);
        console.log('destination miles' + endMiles);
        console.log('origin enginhoures' + startEngineHours);
        console.log('origin miles' + startMiles);

        const csv = await this.driverCsvService.inserDutyStatus(
          driverCsv,
          logs.driverId,
          logs.date,
          logs.startTime,
          logs.endTime,
          logs.eventType,
          logs.eventCode,
          origin?.latitude,
          origin?.longitude,
          origin?.address,
          startMiles,
          startEngineHours,
          logs.truck,
          logs.shippingDocument,
          logs.tralier,
          logs.notes,
          logs.state,
          user?.homeTerminalTimeZone?.tzCode,
        );
        let foundValue = csv.eldEventListForDriversRecordOfDutyStatus.find(
          (element) => {
            return element.eventTime == logs.startTime;
          },
        );
        if (foundValue) {
          let indexOfFoundvalue =
            csv?.eldEventListForDriversRecordOfDutyStatus.indexOf(foundValue);
          if (indexOfFoundvalue > 0) {
            Logger.log('found index is ' + indexOfFoundvalue);
            if (
              indexOfFoundvalue <
              csv?.eldEventListForDriversRecordOfDutyStatus.length - 1
            ) {
              csv.eldEventListForDriversRecordOfDutyStatus[
                indexOfFoundvalue + 1
              ].address = destination?.address;
              csv.eldEventListForDriversRecordOfDutyStatus[
                indexOfFoundvalue + 1
              ].eventLatitude = destination?.latitude;
              csv.eldEventListForDriversRecordOfDutyStatus[
                indexOfFoundvalue + 1
              ].eventLongitude = destination?.longitude;
              csv.eldEventListForDriversRecordOfDutyStatus[
                indexOfFoundvalue + 1
              ].totalEngineHoursDutyStatus = endEngineHours;
              csv.eldEventListForDriversRecordOfDutyStatus[
                indexOfFoundvalue + 1
              ].totalVehicleMilesDutyStatus = endMiles;
            }

            if (
              indexOfFoundvalue ==
              csv.eldEventListForDriversRecordOfDutyStatus.length - 1
            ) {
              //in future if the log is last log of that day
            }
          }
        }

        driverCsv[0].csv = csv;

        /**
         * run hos on current data.
         **/
        const res = await this.driverCsvService.addToDB(driverCsv[0], user);
        let dateOfQuery = moment(date);
        dateOfQuery = dateOfQuery.subtract(1, 'days');
        let dateQuery = dateOfQuery.format('YYYY-MM-DD');
        let queryy = {
          start: dateQuery,
          end: dateQuery,
        };
        await this.driverCsvService.runCalculationOnDateHOS(queryy, user);
      }

      const object = {
        eventSequenceIdNumber,
        eldNumber,
        isAccepted,
        driverId,
        reason,
        origin,
        destination,
      };

      const resp = await this.unidetifiedLogsService.respond(object);
      let messagePatternDriver;

      messagePatternDriver = await firstValueFrom<MessagePatternResponseType>(
        this.driverClient.send({ cmd: 'get_driver_by_id' }, data?.driverId),
      );
      if (messagePatternDriver?.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }
      user = messagePatternDriver?.data;
      SpecificClient = user?.client; //client

      const notificationObj = {
        logs: [],
        dateTime: logs.date,
        driverId: driverId,
        editStatusFromBO: 'added',
        notificationType: 5,
      };
      Logger.log('in unidentified');
      await this.gateway.syncDriver(
        SpecificClient,
        user,
        logs.date,
        notificationObj,
      );

      return response.status(200).send({
        statusCode: 200,
        message: `Unidentified ${
          isAccepted === 1 ? 'Confirmed' : 'Cancelled'
        } successfully!`,
        data: unidentified,
      });
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  //correction for mobile ends here
  @notifyDriverAboutCorrection()
  async NotifyDriverAboutEditPerformed(
    @Query() queryParams,
    @Body() data,
    @Headers('Authorization') authToken: string,
    @Req() request,
    @Res() response,
  ) {
    try {
      const driverId = data.driverId;
      let date = data.date;
      let user;

      // Parsing token for timezone

      let messagePatternDriver;

      messagePatternDriver = await firstValueFrom<MessagePatternResponseType>(
        this.driverClient.send({ cmd: 'get_driver_by_id' }, data?.driverId),
      );
      if (messagePatternDriver?.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }
      user = messagePatternDriver?.data;
      // user.companyTimeZone = user.companyTimeZone;

      let SpecificClient = user?.client;
      // Creating dateTime for driver notification
      let dateTime = moment.tz(date, user?.homeTerminalTimeZone?.tzCode).unix();

      // Create csv pdf for before and after
      // const isConverted = await this.HOSService.generateCsvImages(
      //   dateTime,
      //   data,
      // );
      // const images = isConverted.data;

      /**
       * Push Notification - START
       */
      let images;

      user.id = user._id;
      // Get edited
      const isEdit = await this.logService.getPendingRequests(user);
      if (isEdit.length > 0) {
        // Create csv pdf for before and after
        const isConverted = await this.HOSService.generateCsvImages(user);
        images = isConverted.data;
      }

      const mesaage = 'Edit Inset log!';
      const notificationObj = {
        logs: [],
        editRequest: images != undefined ? [...images] : [],
        dateTime,
        notificationType: 1,
        driverId: driverId,
        editStatusFromBO: 'save',
      };

      const isSilent = false;
      // let WebsocketGateway: WebsocketGateway;

      this.gateway.notifyDriver(
        SpecificClient,
        'notifyDriver',
        mesaage,
        notificationObj,
      );
      // let notificationStatus = await dispatchNotification(
      //   title,
      //   notificationObj,
      //   deviceInfo,
      //   this.pushNotificationClient,
      //   isSilent,
      // );
      /**
       * Push Notification - END
       */

      // const isNotified = await this.HOSService.updateNotificationStatus(
      //   driverId,
      //   notificationStatus,
      //   dateTime,
      // );
      // if (!isNotified) {
      //   return response.status(200).send({
      //     statusCode: 200,
      //     message: 'Something went wrong while dispatching notification!',
      //     data: {},
      //   });
      // }
      return response.status(200).send({
        statusCode: 200,
        // message:
        //   notificationStatus == 'Sent'
        //     ? 'Notification dispatched!'
        //     : 'Something went wrong while dispatching notification',
        // notificationStatus,
        data: {},
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Edit Logs Confirmation/rejection - V2
   * Author : Farzan
   */
  @approveOrRejectEditRequestDecorator()
  async approveOrReject(
    @Body() reqBody,
    @Param() params,
    @Query('driverId') driverId: String,
    @Res() res,
    @Req() request: Request,
  ) {
    try {
      console.log(`In accept/reject constroller >>>>>>>>>>>>>>>>`);
      let SpecificClient;

      let driver, editedBy;
      const { dateTime, isApproved } = reqBody;

      console.log(`In ACCEPT/REJECT | checking dateTime received ${dateTime}`);

      const { id, firstName, lastName } =
        request.user ?? ({ tenantId: undefined } as any);
      const user = request.user ?? ({ tenantId: undefined } as any);

      let messagePatternDriver;
      if (!user.isDriver) {
        messagePatternDriver = await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
        );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
      }
      driver = user.isDriver ? user : messagePatternDriver?.data;
      SpecificClient = driver?.client; //client
      editedBy = {
        id: user.id ? user.id : user._id,
        name: user.firstName + ' ' + user.lastName,
      };

      let statusStr;
      if (isApproved == 'confirm') {
        statusStr =
          driverId != null
            ? `Accepted by ${editedBy.name}`
            : `Accepted by ${editedBy.name}`;
      } else {
        statusStr =
          driverId != null
            ? `Cancelled by ${editedBy.name}`
            : `Cancelled by ${editedBy.name}`;
      }

      if (!driverId) {
        driver = {
          id: id,
          name: firstName + ' ' + lastName,
          homeTerminalTimeZone: user?.homeTerminalTimeZone,
          tenantId: user?.tenantId,
        };
      } else {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
      }

      /**
       * Replace original csv after getting edited one
       */
      let notificationStatus;
      if (isApproved == 'confirm') {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send(
              { cmd: 'get_driver_by_id' },
              driver.id || driver._id,
            ),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }

        let dateOfQuery = moment
          .unix(dateTime)
          .tz(
            driver?.homeTerminalTimeZone?.tzCode ||
              messagePatternDriver?.data?.homeTerminalTimeZone?.tzCode,
          );

        let dateQuery = dateOfQuery.format('YYYY-MM-DD');
        console.log(`In ACCEPT/REJECT | checking dateQuery date ${dateQuery}`);
        const date = dateOfQuery;
        let query = {
          start: date.format('YYYY-MM-DD'),
          end: date.format('YYYY-MM-DD'),
        };

        console.log(
          `In ACCEPT/REJECT | Before getting csv of date ${query.start}`,
        );
        // Get original
        const driverCsv = await this.driverCsvService.getGraphFromDB(
          query,
          driver,
        );
        // Get edited
        const isEdit = await this.logService.isEditInsertReqExists(
          dateTime,
          driver._id || driver.id,
        );
        let editDate;
        if (driverCsv.length > 0 && isEdit) {
          for (
            let i = 0;
            i <
            isEdit.csvAfterUpdate.csv[
              'eldEventListForDriversRecordOfDutyStatus'
            ].length;
            i++
          ) {
            if (
              isEdit.csvAfterUpdate.csv[
                'eldEventListForDriversRecordOfDutyStatus'
              ][i].eventRecordOrigin == '3'
            ) {
              isEdit.csvAfterUpdate.csv[
                'eldEventListForDriversRecordOfDutyStatus'
              ][i].eventRecordOrigin = '2';
            }
          }

          // Create a new Date object for the current date and time in the target time zone
          const currentDateTime = new Date().toLocaleString('en-US', {
            timeZone: driver.homeTerminalTimeZone.tzCode,
          });

          // Format the date portion in the "yyyy-MM-dd" format
          const currentDate = new Date(currentDateTime)
            .toISOString()
            .split('T')[0];

          console.log(currentDate);

          editDate = (isEdit as any).editDate;
          editDate = moment
            .utc(editDate)
            .tz(driver.homeTerminalTimeZone.tzCode);

          editDate = editDate.toISOString().split('T')[0];
          console.log(editDate + '=-----------');
          let timePlaceLine = JSON.parse(
            JSON.stringify(driverCsv[0].csv['timePlaceLine']),
          );
          let logs = (isEdit as any).logs[0];
          let lastElement = (isEdit as any).lastItem;
          if (currentDate == editDate) {
            if (lastElement) {
              timePlaceLine.currentEventCode = logs?.eventCode;
              timePlaceLine.currentLatitude = logs?.eventLatitude;
              timePlaceLine.currentLongitude = logs?.eventLongitude;
              timePlaceLine.currentEventType =
                logs?.eventType || timePlaceLine.currentEventType;
              driverCsv[0].csv['timePlaceLine'] = timePlaceLine;
            }
          }
          // replace with new headers
          driverCsv[0].csv['eldEventListForDriversRecordOfDutyStatus'] =
            isEdit.csvAfterUpdate.csv[
              'eldEventListForDriversRecordOfDutyStatus'
            ];

          console.log(
            `In ACCEPT/REJECT | Before adding csv to DB of date ${query.start}`,
          );
          await this.driverCsvService.addToDB(driverCsv[0], driver);
        }

        console.log(
          `In ACCEPT/REJECT | Before runn ing HOS of date ${query.start}`,
        );

        dateOfQuery = dateOfQuery.subtract(1, 'days');
        dateQuery = dateOfQuery.format('YYYY-MM-DD');
        let queryy = {
          start: dateQuery,
          end: dateQuery,
        };
        console.log(`Before HOS calculation >>>>>>>>>>>>>>>>>> `);
        console.log(`query >>>>>>>>>>>>>>>>>> `, queryy);
        await this.driverCsvService.runCalculationOnDateHOS(queryy, driver);
        console.log(`After HOS calculation >>>>>>>>>>>>>>>>>> `);

        console.log(
          `In ACCEPT/REJECT | After running HOS of date ${query.start}`,
        );

        // Updating report
        // let signature = '';
        // if (isEdit && (isEdit.shippingId || isEdit.trailerNumber)) {
        //   const ship = isEdit.shippingId;
        //   let logform = await updateLogform(
        //     this.reportClient,
        //     ship,
        //     signature,
        //     isEdit.driverId,
        //     query.start,
        //     driver?.homeTerminalTimeZone?.tzCode,
        //     isEdit.trailerNumber,
        //   );
        // }

        /**
         * Fetching driver's deviceToken
         */

        Logger.log('Running');

        // Initiating notificaion dispatch
        const title = `Edit request ${
          isApproved == 'confirm' ? 'confirmed' : 'cancelled'
        }!`;
        const notificationObj = {
          logs: [],
          dateTime: dateTime,
          driverId: driverId,
          editStatusFromBO: 'cancel',
          notificationType: 5,
        };
        await this.gateway.syncDriver(
          SpecificClient,
          driver,
          date.format('YYYY-MM-DD'),
          notificationObj,
        );

        //comment
        notificationStatus = true;

        // const { firstName, lastName } = messagePatternDriver?.data;
        driver = {
          id: driver.id || driver._id,
          name: firstName + ' ' + lastName,
        };
      } else {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send(
              { cmd: 'get_driver_by_id' },
              driver.id || driver._id,
            ),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }

        /**
         * Fetching driver's deviceToken
         */
        const deviceToken = messagePatternDriver?.data?.deviceToken;
        const deviceType = messagePatternDriver?.data?.deviceType;

        // Initiating notificaion dispatch

        notificationStatus = true; // repressents notification is silent or not
      }

      const response = await this.logService.responseToEditInsertLog(
        driver,
        dateTime,
        isApproved,
        statusStr,
        notificationStatus,
      );

      /**
       * Maintaining log history
       */
      const historyObj = {
        driverId: driver.id,
        driver: driver,
        editedBy: editedBy,
        dateTime: dateTime,
        status: statusStr,
        isApproved: isApproved,
      };
      await this.logService.maintainHistory(historyObj);
      if (isApproved !== 'confirm') {
        let images;
        const isEdit = await this.logService.getPendingRequests(user);
        if (isEdit.length > 0) {
          // Create csv pdf for before and after
          const isConverted = await this.HOSService.generateCsvImages(user);
          images = isConverted.data;
        }
        const title = `Edit request ${
          isApproved == 'confirm' ? 'confirmed' : 'cancelled'
        }!`;
        const notificationObj = {
          logs: [],
          editRequest: images != undefined ? [...images] : [],
          dateTime: dateTime,
          driverId: driverId,
          editStatusFromBO: 'cancel',
          notificationType: 5,
        };

        await this.gateway.notifyDriver(
          SpecificClient,
          'notifyDriver',
          title,
          notificationObj,
        );
      }
      return res.status(response.statusCode).send({
        statusCode: response.statusCode,
        message: response.message,
        notificationStatus,
        data: response.data,
      });
    } catch (error) {
      throw error;
    }
  }
  /**
   * Edit Logs Pending List - V2
   * Author : Farzan
   */
  @pendingEditRequestDecorator()
  async pendingEditRequest(
    @Param() params,
    @Query('dateTime') dateTime: String,
    @Res() res,
    @Req() request,
  ) {
    try {
      let driver;
      let images;

      const { id, firstName, lastName } =
        request.user ?? ({ tenantId: undefined } as any);
      const user = request.user ?? ({ tenantId: undefined } as any);

      driver = user;

      // Get edited
      const isEdit = await this.logService.getPendingRequests(driver);
      if (isEdit.length > 0) {
        // Create csv pdf for before and after
        const isConverted = await this.HOSService.generateCsvImages(driver);
        images = isConverted.data;
      }

      return res.status(200).send({
        statusCode: 200,
        message:
          images != undefined
            ? 'Pending requests fetched successfully!'
            : 'No records found!',
        data: images != undefined ? [...images] : [],
      });
    } catch (error) {
      throw error;
    }
  }
  /**
   * @route : /api/HOS/history
   * @defaultParam /api/HOS/history?date=YYYY-MM-DD
   * @viewDetailParam /api/HOS/history?detail=true&id={{id}}
   *
   * @description : Fetches edit history detail of a particular date
   */
  @GetMaintainedHistoryDecorator()
  async getMaintainedHistory(
    @Body() reqBody,
    @Param() params,
    @Query() queryParams,
    @Res() res,
    @Req() req,
  ) {
    try {
      let timezone = queryParams.timezone;

      // this section is for getting driver data if the request is from admin.
      let user;

      const response = await this.HOSService.getMaintainedHistory(
        queryParams,
        timezone,
      );
      return res.status(response.statusCode).send(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch Edit log history of a driver - V2
   * Author : Farzan
   */
  // @Get('/edithistory')
  @GetEditLogHistory()
  async fetchEditInsertLogHistory(@Query() query, @Req() req, @Res() res) {
    try {
      let { driverId, pageNo, limit } = query;
      const { id } = req.user ?? ({ tenantId: undefined } as any);
      if (!driverId) {
        driverId = id;
      }
      query.driverId = driverId;

      const response = await this.logService.editInsertLogHistory(query);
      return res.status(response.statusCode).send(response);
    } catch (error) {
      throw error;
    }
  }

  /**
   * driver live location - V2
   * Author : Farzan
   */
  @liveLocationHistory()
  async addLiveLocation(@Req() req, @Res() res, @Body() reqBody: any) {
    // @Body() reqBody: DriverLiveLocationDto,
    try {
      const { id, tenantId } = req.user;
      const { user } = req;
      // let purifiedArray = [];
      // if (reqBody.length > 12) {
      //   reqBody.forEach((element, index) => {
      //     if (index % 5 !== 0) {
      //       purifiedArray.push(element);
      //     }
      //   });
      // }
      // Logger.log(
      //   '------------------->>>>>>> Arraay Sorted' + purifiedArray.length,
      // );
      let sortedArray = await sortLiveLocations(reqBody?.data);

      const historyOfLocation =
        sortedArray[sortedArray.length - 1]?.historyOfLocation;
      Logger.log('------------------->>>>>>> Arraay Sorted');
      // Logger.log(
      //   'MERAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
      //     JSON.stringify(reqBody.historyOfLocation),
      // );

      const meta = reqBody?.meta;
      if (meta?.address == '') {
        delete historyOfLocation?.address;
      }
      meta['lastActivity'] = {
        odoMeterMillage: historyOfLocation?.odometer,
        engineHours: historyOfLocation?.engineHours,
        currentTime: historyOfLocation?.time,
        currentDate: historyOfLocation?.date,
        latitude: historyOfLocation?.latitude,
        longitude: historyOfLocation?.longitude,
        address: historyOfLocation?.address,
        speed: historyOfLocation?.speed,
        currentEventCode: historyOfLocation?.status || '1',
        currentEventType: historyOfLocation?.eventType,
      };
      Logger.log('------------------->>>>>>> Meta Object Created');

      const messagePatternUnits =
        await firstValueFrom<MessagePatternResponseType>(
          this.unitClient.send({ cmd: 'assign_meta_to_units' }, { meta, user }),
        );
      if (messagePatternUnits.isError) {
        mapMessagePatternResponseToException(messagePatternUnits);
      }

      Logger.log('------------------->>>>>>> Unit updated');
      let locationObj;

      const obj = {
        driverId: id,
        tenantId,
        sortedArray,
      };

      const response = this.HOSService.addLiveLocation(obj); // await removed

      Logger.log('------------------->>>>>>> live  location done');

      return res.status(200).send({ message: 'entry added successfully' });
    } catch (error) {
      throw error;
    }
  }
  /**
   * driver Tracking Driver Location - V3
   * Author : Sharif Sadique
   */
  @specificDaytripDecorators()
  async specificDay(
    @Query('driverId') driverId: String,
    @Query('date') date: string = moment().format('MMDDYY'),

    @Res() res,
    @Req() request: Request,
  ) {
    try {
      const queryObj = {
        driverId: driverId ? driverId : null,
        date: date ? moment(date).format('MMDDYY') : null,
        time: null,
      };

      const messagePatternDriver =
        await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
        );
      if (messagePatternDriver.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }

      const response = await this.HOSService.getLiveLocation(queryObj);
      Logger.log(
        '-------------------------------------' + response.data.length,
      );
      let locations = [];

      function convertToSeconds(time) {
        const hours = parseInt(time.slice(0, 2));
        const minutes = parseInt(time.slice(2, 4));
        const seconds = parseInt(time.slice(4, 6));

        return hours * 3600 + minutes * 60 + seconds;
      }

      let allLocations = JSON.parse(JSON.stringify(response.data));
      let driving = allLocations.filter((element) => {
        return (
          (element.status == '3' && element.eventType == '1') ||
          (element.status == '1' && element.eventType == '3') ||
          (element.status == '2' && element.eventType == '3')
        );
      });
      let prevLog = allLocations[0];
      let newArray = [];
      let totalTime = 0;
      for (let i = 1; i < allLocations.length; i++) {
        if (allLocations[i].status != prevLog.status) {
          const prevTime = convertToSeconds(prevLog.time);
          const currentTime = convertToSeconds(allLocations[i].time);
          totalTime = currentTime - prevTime;
          let newLog = JSON.parse(JSON.stringify(prevLog));
          newLog.duration = totalTime;
          newArray.push(newLog);
          prevLog = allLocations[i];
          totalTime = 0;
        }
        if (i == allLocations.length - 1) {
          const prevTime = convertToSeconds(prevLog.time);
          const currentTime = convertToSeconds(allLocations[i].time);
          totalTime = currentTime - prevTime;
          let newLog = JSON.parse(JSON.stringify(prevLog));
          newLog.duration = totalTime;
          newArray.push(newLog);
        }
      }
      let otherThenDriving = newArray.filter((element) => {
        return (
          (element.status != '3' && element.eventType != '1') ||
          (element.status != '1' && element.eventType != '3') ||
          (element.status != '2' && element.eventType != '3')
        );
      });
      // add google api here and calculate address of otherThenDriving statuses
      for (let i = 0; i < otherThenDriving.length; i++) {
        let address = await this.driverCsvService.getAddress(
          otherThenDriving[i].latitude,
          otherThenDriving[i].longitude,
        );
        otherThenDriving[i].address = address;
      }
      let responseArray = [...otherThenDriving, ...driving];
      responseArray = responseArray.sort((a, b) => a.time - b.time);
      return res.status(response.statusCode).send(responseArray);
    } catch (error) {
      throw error;
    }
  }

  /**
   * driver live location : GET - V2
   * Author : Farzan
   */
  @FetchDriverLiveLocation()
  async getLiveLocation(
    @Query() query: FetchDriverLiveLocationDto,
    @Res() res,
  ) {
    try {
      const { driverId, date, time } = query;

      const queryObj = {
        driverId: driverId ? driverId : null,
        date: date ? moment(date, 'YYYY-MM-DD').format('MMDDYY') : null,
        time: time ? time : null,
      };

      const messagePatternDriver =
        await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
        );
      if (messagePatternDriver.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }

      const response = await this.HOSService.getLiveLocation(queryObj);
      // add google api here and calculate address of otherThenDriving statuses
      let arrayPresent = response.data;
      for (let i = 0; i < arrayPresent.length; i++) {
        let address = await this.driverCsvService.getAddress(
          arrayPresent[i].latitude,
          arrayPresent[i].longitude,
        );
        arrayPresent[i].address = address;
      }
      response.data = arrayPresent;
      return res.status(response.statusCode).send(response);
    } catch (error) {
      throw error;
    }
  }
}
