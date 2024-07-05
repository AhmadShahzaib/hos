import {
  BaseController,
  mapMessagePatternResponseToException,
  MessagePatternResponseType,
  SocketManagerService,
  MessagePatternResponseInterceptor,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

import moment from 'moment-timezone';
import {
  Controller,
  Inject,
  Body,
  Res,
  Headers,
  Logger,
  Req,
  UseInterceptors,
  Delete,
  Query,
  Param,
  Get,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { updateVariables } from 'shared/calculateClocks';
import AddDriverCsvDecorators from 'decorators/addDriverCsvDecorators';
import GetDriverHOSDecorators from 'decorators/getDriverHOSDecorators';
import DelDriverCsvDecorators from 'decorators/delDriverCsvDecorators';
import GetDriverCsvForAdminDecorators from 'decorators/getDriverCsvForAdminDecorators';
import { Response, Request } from 'express';
import { mapKeys, camelCase } from 'lodash';
import { DriverCsvService } from 'services/driverCsv.service';
import GetOrignalLogDecorator from 'decorators/GetOrignalLogDecorator';
import { AppService } from '../services/app.service';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import { LogEntryResponseModel } from 'models/logEntry.response.model';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { firstValueFrom, filter } from 'rxjs';
import liveApiUnit from 'decorators/liveApiUnit';
import DeleteDriverCsvLogDecorator from 'decorators/deleteDriverCsvLogDecorator';
import { fileCheckData } from 'utils/fileDataCheck';
import { DeleteLogBody } from 'dto/deleteLog.dto';
import NormalizeDriverCsvDuty from 'decorators/normalizeDriverCsvDuty';
import {
  getDatesBetweenUnixTimestamps,
  isSameDay,
} from 'utils/getDatesBetweenUnixTimestamps';
import TransferLogs from 'decorators/transferLogs';
import { NormalizeBodyDto } from 'dto/normalizeBody.dto';
import { NormalizeQueryDto } from 'dto/normalizeQuery.dto';
import { dispatchNotification } from 'utils/dispatchNotification';
import InsertLogDriverCsvLogDecorator from 'decorators/insertLogInfoDecorator';

import GetLogformDecorators from 'decorators/getLogForm';

import { InsertLogInfoBodyDto } from 'dto/insertLogInfo.dto';
import { getLog } from 'utils/findObj';
import { findSqID } from 'utils/findSquenceId';
import { generateUniqueHexId } from 'utils/generateEventSeqId';
import { formateDate } from 'utils/formateDate';
import { insertIntermediat } from 'utils/insertIntermediat';
import { updateLogform } from 'utils/updateLogform';
import { insert_Login_Logout } from 'utils/login_logout';
import { insert_powerup_powerdown } from 'utils/powerupPowerdown';
import InsertDutyStatusDecorator from 'decorators/InsertDutyStatusDecorators';
import { InsertDutyStatusDTO } from 'dto/insertDutyLog.dto';
import { getInBetweenLogs } from 'utils/findInBetweenLogs';
import { addFirstandLast } from 'utils/addFirstandLastLog';
import { createNewLog } from 'utils/createNewLog';
import { removeDuplicateConsecutiveLogs } from 'utils/removeDuplicateConsecutiveLogs';
import { error } from 'console';
import { insertLog } from 'utils/insertLog';
import getLocationDecorators from 'decorators/getLocationDecorators';
import { removeObjectByEventSequenceId } from 'utils/findLog';
import { googleGeocode } from 'utils/googleGeocode';
import getLatLngFromAddressDecorator from 'decorators/getLatLngFromAddressDecorator';
import GetDriverRecords from 'decorators/getDriversRecord';
import { WebsocketGateway } from '../websocket/websocket.gateway';

import CreateMissingIntermediatesDecorator from 'decorators/createMissingIntermediatesDecorator';
@Controller('HOS')
@ApiTags('HOS')
export class DriverCsvController extends BaseController {
  private readonly logger = new Logger('HOS App Controller');
  private readonly snakeCaseMapper = (val) =>
    mapKeys(val, (v, k) => {
      return camelCase(k);
    });
  constructor(
    @Inject('AppService') private readonly HOSService: AppService,
    @Inject('DriverCsvService')
    private readonly driverCsvService: DriverCsvService,
    @Inject('DRIVER_SERVICE') private readonly driverClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
    // @Inject('PUSH_NOTIFICATION_SERVICE') // private readonly pushNotificationClient: ClientProxy, // @Inject('COMPANY_SERVICE') private readonly companyClient: ClientProxy,
    @Inject('UNIT_SERVICE') private readonly unitClient: ClientProxy,
    @Inject('PUSH_NOTIFICATION_SERVICE')
    private readonly pushNotificationClient: ClientProxy,
    private readonly gateway: WebsocketGateway,
  ) {
    super();
  }

  @liveApiUnit()
  async addLiveApiUnit(
    @Body() data: any,
    @Param('id') id: any,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      const { body, user } = request;
      if (id) {
        const messagePatternUnits = await firstValueFrom(
          this.unitClient.send({ cmd: 'get_unit_by_vehicleID' }, id),
        );
      }
      const messagePatternUnits =
        await firstValueFrom<MessagePatternResponseType>(
          this.unitClient.send({ cmd: 'assign_meta_to_units' }, { body, user }),
        );
      if (messagePatternUnits.isError) {
        mapMessagePatternResponseToException(messagePatternUnits);
      } else {
        return response.status(400).send({
          message: 'Entry rejected',
        });
      }

      return response.status(500).send({
        message: 'Entry Added Successfully',
      });
    } catch (error) {
      return response.status(400).send({
        message: error,
      });
    }
  }

  @AddDriverCsvDecorators()
  async AddDriverCsv(
    @Body() data: Array<any>,
    @Headers('Authorization') authToken: string,
    @Res() response: Response,
    @Req() request,
  ) {
    try {
      const { body, user } = request;
      if (!body.meta) {
        return response.status(400).send({
          message: 'Entry in meta is rejected as meta is not available',
        });
      }
      if (!body.meta.deviceCalculations) {
        return response.status(400).send({
          message: 'Entry in  rejected as deviceCalculations is not available',
        });
      }
      if (!body.meta.dateTime) {
        return response.status(200).send({
          message:
            'Entry in  rejected as deviceCalculations.isDataFound is not available',
        });
      }
      if (!body.csv) {
        return response.status(400).send({
          message: 'Entry in meta is rejected as csv is not available',
        });
      }
      if (!body.csv.timePlaceLine) {
        return response.status(400).send({
          message:
            'Entry in meta is rejected as csv timeplaceline is not available',
        });
      }
      if (!body.meta.pti) {
        return response.status(400).send({
          message: 'Entry in meta is rejected as PTI is not available',
        });
      }
      // 1. Check if driver data available ----340
      console.log(`In controller ---- `);
      const recentCSV = await this.driverCsvService.getLatestCSV(
        {
          start: moment().format('YYYY-MM-DD'),
          end: moment().format('YYYY-MM-DD'),
        },
        user,
      );
      const previousBody = JSON.parse(JSON.stringify(body));
      let resp;
      let reqBody;

      const csvPresent = isSameDay(body.meta.dateTime, body.meta.dateTime);

      if (recentCSV != 2) {
        if (recentCSV.length == 0) {
          const datesBetween = getDatesBetweenUnixTimestamps(
            moment().subtract(14, 'day').unix(),
            moment().subtract(1, 'day').unix(),
            user.homeTerminalTimeZone.tzCode,
          );

          for (const date of datesBetween) {
            Logger.log('Date +++++++++++++++++ \n\n\n' + date);
            reqBody = await this.driverCsvService.createMissingCSV(
              previousBody,
              user,
              date,
            );
            console.log(`In add date of  ---- >>> `, date);
            await this.driverCsvService.addToDB(reqBody, user);

            // This code is to tpdate driver record need to add messagepattern to get unit  =  get_unit_by_driverId
            await this.driverCsvService.updateRecordMade(user, reqBody);
          }
        }
        // else if(recentCSV.length > 0){
        // if ever want to oder the first time sort issue
        // }
      }
      console.log(`ouside date adding dataa`);

      resp = await this.driverCsvService.addToDB(body, user);

      if (resp?.error) {
        return response.status(400).send({
          message: resp.message,
        });
      }
      const meta = this.driverCsvService.updateMetaVariables(body);
      const messagePatternUnits =
        await firstValueFrom<MessagePatternResponseType>(
          this.unitClient.send({ cmd: 'assign_meta_to_units' }, { meta, user }),
        );
      if (messagePatternUnits.isError) {
        mapMessagePatternResponseToException(messagePatternUnits);
      }
      // let dateOfQuery = moment(body.date);
      // dateOfQuery = dateOfQuery.subtract(1, 'days');
      // let dateQuery = dateOfQuery.format('YYYY-MM-DD');

      if (resp) {
        return response.status(200).send({
          message: 'Entry Added Successfully',
          data: resp,
        });
      } else {
        return response.status(400).send({
          message: resp,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @route : /api/HOS/orignal
   * @defaultParam /api/HOS/history?date=YYYY-MM-DD
   * @viewDetailParam /api/HOS/history?detail=true&id={{id}}
   *
   * @description : Fetches edit history detail of a particular date
   */
  @GetOrignalLogDecorator()
  async GetOrignalLogDecorator(
    @Body() reqBody,
    @Param() params,
    @Query() queryParams,
    @Res() res,
    @Req() req,
  ) {
    try {
      //  const response = await this.HOSService.getOrignalLogs(queryParams);
      let user;
      if (!queryParams.id) {
        return {
          statusCode: 200,
          message: 'driverId not found add id in params!',
          data: [],
        };
      }
      const driverId = queryParams.id;
      if (driverId) {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver.data;
      }
      const inputDate = moment(queryParams.date).format('YYYY-MM-DD');
      const query = {
        start: inputDate,
        end: inputDate,
      };
      const response = await this.driverCsvService.getFromDB(query, user);
      if (!response.graphData[0].originalLogs) {
        return res.status(200).send({
          message: 'Please get latest Build ',
          data: {},
        });
      }
      const originalLogs = response.graphData[0].originalLogs;
      const csv = response.graphData[0].csv;

      csv.eldEventListForDriversRecordOfDutyStatus =
        originalLogs.eldEventListForDriversRecordOfDutyStatus;
      csv.cmvEnginePowerUpShutDownActivity =
        originalLogs.cmvEnginePowerUpShutDownActivity;
      csv.eldEventListForDriverCertificationOfOwnRecords =
        originalLogs.eldEventListForDriverCertificationOfOwnRecords;
      csv.eldLoginLogoutReport = originalLogs.eldLoginLogoutReport;
      const violations = response.graphData[0].meta.voilations;
      const resp = {
        csvBeforeUpdate: { csv: csv, violations: violations },
      };
      return res.status(200).send({
        message: 'Success',
        data: resp,
      });
    } catch (error) {
      throw error;
    }
  }

  @DelDriverCsvDecorators()
  async DeleteDriverCsv(
    @Headers('Authorization') authToken: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      console.log('ïn end point');
      const { query, user } = request;

      const resp: any = await this.driverCsvService.delFromDB(query, user);
      if (resp.deletedCount > 0) {
        return response.status(200).send({
          message: 'Success, deleted record',
          data: resp,
        });
      } else if (resp.deletedCount == 0) {
        return response.status(404).send({
          message: 'No, record found there.',
        });
      }
    } catch (error) {
      throw error;
    }
  }
  @GetLogformDecorators()
  async getLogform(
    @Query('driverId') driverId: string,
    @Query('date') date: string,
    @Res() res,
    @Req() req,
  ) {
    try {
      let user;
      if (driverId) {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver.data;
      }
      const query = {
        start: date,
        end: date,
      };
      const resp = await this.driverCsvService.getLogform(query, user);

      return res.status(200).send({
        message: 'Success',
        data: resp,
      });
    } catch (error) {
      throw error;
    }
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'call_sync' })
  async callSync(data: any): Promise<any> {
    try {
      const { SpecificClient, user, date, notificationObj } = data;

      await this.gateway.syncDriver(
        SpecificClient,
        user,
        date,
        notificationObj,
      );
      return true;
    } catch (error) {
      return error;
    }
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_length_of_data' })
  async getLengthOfData(requestParam: any): Promise<any> {
    try {
      const { date, driverInfo } = requestParam;
      const resp: any = await this.driverCsvService.checkDataLengthInSchema(
        date,
        driverInfo,
      );
      return { resp };
    } catch (error) {
      return error;
    }
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_logs_of_specific_date_range' })
  async get_logs_between_range(requestParam: any): Promise<any> {
    try {
      const { driverId, startDate, endDate } = requestParam;
      let user = [];
      if (driverId) {
        // await this.driverClient.connect();
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver.data;
        // await this.driverClient.close();
      }

      const query = {
        start: startDate.toString(),
        end: endDate.toString(),
      };

      const resp: any = await this.driverCsvService.getGraphFromDB(query, user);
      return resp;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }
  // @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'add_update_recordTable' })
  async add_update_record(requestParam: any): Promise<any> {
    try {
      const result = await this.driverCsvService.addAndUpdateDriverRecord(
        requestParam,
      );
      return result['_doc'];
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_recordTable' })
  async get_record(requestParam: any): Promise<any> {
    try {
      const { driverID, date } = requestParam;
      const resp: any = await this.driverCsvService.findByDriverID(
        driverID,
        date,
      );
      return resp;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_recordTable_7Days' })
  async get_record_7Days(requestParam: any): Promise<any> {
    try {
      const { driverID, startDate, endDate } = requestParam;
      const resp: any = await this.driverCsvService.findByDriverIDWithDate(
        driverID,
        startDate,
        endDate,
      );
      return resp;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }
  // @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'update_certification' })
  async update_certification(requestParam: any): Promise<any> {
    try {
      const { driverId, csv } = requestParam;
      let user = [];
      if (driverId) {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver.data;
      }
      const completeObj = csv.data[0];
      const resp: any = await this.driverCsvService.updateToDB(
        completeObj,
        user,
      );
      return resp;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }
  @TransferLogs()
  async TransferLogs(
    @Headers('Authorization') authToken: string,
    @Query('driverId') driverId: string,
    @Query('date') date: string,
    @Query('sequenceId') sequenceId: string,
    @Query('duration') duration: string,
    @Query('type') type: number,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      let user;
      let SpecificClient;
      if (driverId) {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver.data;
        SpecificClient = user?.client;
      }
      const resp = await this.driverCsvService.transferLog(
        sequenceId,
        date,
        duration,
        user,
        type,
      );
      let dateOfQuery = moment(date);
      dateOfQuery = dateOfQuery.subtract(1, 'days');
      const dateQuery = dateOfQuery.format('YYYY-MM-DD');
      const query = {
        start: dateQuery,
        end: dateQuery,
      };
      await this.driverCsvService.runCalculationOnDateHOS(query, user);
      if (resp == 1) {
        const notificationObj = {
          logs: [],
          dateTime: date,
          driverId: driverId,
          notificationType: 4,
          editStatusFromBO: 'transfer',
        };
        await this.gateway.syncDriver(
          SpecificClient,
          user,
          date,
          notificationObj,
        );

        return response.status(200).send({
          message: 'Success',
          data: resp,
        });
      }
      if (resp == 2) {
        return response.status(400).send({
          message: 'Not transfered',
          data: resp,
        });
      }
      if (resp == 3) {
        return response.send({
          message: 'Driver is created after this date so you cannot transfer ',
          data: resp,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  @GetDriverCsvForAdminDecorators()
  async GetDriverCsvForAdmin(
    @Headers('Authorization') authToken: string,
    @Query('driverId') driverId: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      const { query, params } = request;
      // this section is for getting driver data if the request is from admin.
      let user;
      if (driverId) {
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver.data;
      } else {
        user = request.user;
      }

      const result = await this.driverCsvService.runCalculationOnRecentHOS(
        query,
        user,
      );
      if (result == 2) {
        return response.status(200).send({
          message: 'Failed as no data is available ',
        });
      }
      const resp: any = await this.driverCsvService.getFromDB(query, user);
      // let latestCSV = this.driverCsvService.calculateHOS(recentCSV[0], user);

      // The funtion below calculates the missing intermediates virtually. It doesn't saves them anywhere, it's just to show - START
      // console.log(`Before the function call`);
      // // let extractedDutyStatus =
      // //   resp.graphData[0].csv.eldEventListForDriversRecordOfDutyStatus;
      // // console.log(`extractedDutyStatus >>>>>>>> `, extractedDutyStatus);

      // // const newExtractedDutyStatus =
      // //   await this.driverCsvService.calculateMissingIntermediates(
      // //     extractedDutyStatus,
      // //   );
      // // console.log(`newExtractedDutyStatus >>>>>>>> `, newExtractedDutyStatus);

      // // resp.graphData[0].csv.eldEventListForDriversRecordOfDutyStatus =
      // //   newExtractedDutyStatus;
      // console.log(`After the function call`);
      // The funtion above calculates the missing intermediates virtually. It doesn't saves them anywhere, it's just to show - END

      if (resp) {
        return response.status(201).send({
          message: 'Success',
          data: resp,
        });
      } else {
        return response.status(400).send({
          message: 'Success',
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @Function : Delete log
   * @Description : Deletable log types
   *     a. POWER - UP/DOWN   b. Intermediate logs    c. Certify logs  |  deletableEventTypes = ['2', '4', '6'];
   * @Author : Farzan
   * @Version : V3
   */
  @DeleteDriverCsvLogDecorator()
  async deleteLog(
    @Req() req,
    @Res() res,
    @Body() reqBody: DeleteLogBody,
    @Query() queryParams,
    @Param() params,
  ) {
    try {
      console.log(`in delete log controller `);

      const { date } = queryParams;
      const { driverId } = params;
      const { eventSequenceIdNumber } = reqBody;

      const logsOfSelectedDate = await this.get_logs_between_range({
        driverId: driverId,
        startDate: date,
        endDate: date,
      });
      if (logsOfSelectedDate.length == 0) {
        return res.status(404).send({
          message: 'No, record found there.',
        });
      }

      /**
       * delete log
       */
      const deletedLogs = await this.driverCsvService.deleteLog(
        logsOfSelectedDate,
        eventSequenceIdNumber,
      );

      if (deletedLogs.isIncluded.isIncludedFlag == false)
        return res.status(200).send({
          statusCode: 200,
          message: deletedLogs.isIncluded.message,
          data: {},
        });

      const messagePatternDriver =
        await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
        );
      if (messagePatternDriver.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }
      const user = messagePatternDriver.data;

      const filteredLogs = deletedLogs.deletedObjects
        .filter((element) => {
          return element.eventTypeExtra == 6;
        })
        .sort((a, b) => a.eventTime.localeCompare(b.eventTime));
      // get time of last deleted log from this first filter logs which are powerup base then compare time.and rest of function is done
      // code here.
      const todayDate = moment()
        .tz(user.homeTerminalTimeZone.tzCode)
        .format('YYYY-MM-DD');

      // let todayDate = today.toISOString().split('T')[0];

      if (todayDate !== date && filteredLogs.length > 0) {
        const previousLogTime = filteredLogs[filteredLogs.length - 1].eventTime;

        const powerUp =
          logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity?.sort(
            (a, b) => a.eventTime.localeCompare(b.eventTime),
          );
        if (powerUp.length > 0) {
          const lastLog = powerUp[powerUp.length - 1];
          const lastLogTime = lastLog.eventTime;

          if (lastLogTime < previousLogTime) {
            let dateOfQuery = moment(logsOfSelectedDate[0].date);
            dateOfQuery = dateOfQuery.add(1, 'days'); // Use 'add' instead of 'subtract'
            const dateQuery = dateOfQuery.format('YYYY-MM-DD');
            const logsOfnextDate = await this.get_logs_between_range({
              driverId: driverId,
              startDate: dateQuery,
              endDate: dateQuery,
            });
            if (
              powerUp.length > 0 &&
              (lastLog.eventCode == '2' || lastLog.eventCode == '1')
            ) {
              logsOfnextDate[0].meta.powerUp = true;
            } else if (
              powerUp.length > 0 &&
              (lastLog.eventCode == '4' || lastLog.eventCode == '3')
            ) {
              logsOfnextDate[0].meta.powerUp = false;
            }
            const result = await this.driverCsvService.addToDB(
              logsOfnextDate[0],
              user,
            );
          }
        } else {
          let dateOfQuery = moment(logsOfSelectedDate[0].date);
          dateOfQuery = dateOfQuery.add(1, 'days'); // Use 'add' instead of 'subtract'
          const dateQuery = dateOfQuery.format('YYYY-MM-DD');
          const logsOfnextDate = await this.get_logs_between_range({
            driverId: driverId,
            startDate: dateQuery,
            endDate: dateQuery,
          });
          logsOfnextDate[0].meta.powerUp =
            deletedLogs.logsOfSelectedDate[0].meta.powerUp;
          const result = await this.driverCsvService.addToDB(
            logsOfnextDate[0],
            user,
          );
        }
      }

      await this.driverCsvService.addToDB(
        deletedLogs.logsOfSelectedDate[0],
        user,
      );

      const deviceToken = user.deviceToken;
      const deviceType = user.deviceType;

      //"notifcationType -> [ 1 = editLog || 2 = unidentifiedLog || 3 = insertLog" || 4 = 'deleteLog']
      // Initiating notification dispatch
      const title = 'Delete logs executed!';
      const notificationObj = {
        logs: [],
        dateTime: date,
        driverId: driverId,
        notificationType: 4,
        editStatusFromBO: 'delete',
      };
      const deviceInfo = {
        deviceToken: deviceToken,
        deviceType: deviceType,
      };

      await dispatchNotification(
        title,
        notificationObj,
        deviceInfo,
        this.pushNotificationClient,
        true, // repressents notification is silent or not
      );

      return res.status(200).send({
        statusCode: 200,
        message: 'Logs deleted successfully!',
        data: deletedLogs.deletedObjects,
      });
    } catch (err) {
      throw err;
    }
    235959;
  }

  /**
   * @Function : Normalize log/DUTY HOURS
   * @Description : Normalize the logs that have  been missed by creating them on average calculations
   * @Author : Farzan
   * @Version : V3
   */
  @NormalizeDriverCsvDuty()
  async normalizeDriverCsvDuty(
    @Req() req,
    @Res() res,
    @Body() reqBody: NormalizeBodyDto,
    @Query() queryParams: NormalizeQueryDto,
    @Param() params,
  ) {
    try {
      Logger.log('In Normalize Decorato Endpoint');
      let SpecificClient;
      const { date, type, normalizationType } = queryParams;
      const { driverId } = params;
      const { eventSequenceIdNumber } = reqBody;
      let speed;
      let user;
      let normalizedResp;
      const messagePatternDriver =
        await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
        );
      if (messagePatternDriver.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }
      user = messagePatternDriver.data;
      if (!user) {
        return res.status(200).send({
          statusCode: 200,
          message: 'Driver not found!',
          data: {},
        });
      }
      normalizedResp = await this.driverCsvService.normalizeFunction(
        user,
        speed,
        date,
        type,
        driverId,
        eventSequenceIdNumber,
        res,
        req,
        reqBody,
        queryParams,
        params,
        normalizedResp,
        normalizationType,
      );
      // Initiation notificaion dispatch

      const notificationObj = {
        logs: [],
        dateTime: date,
        driverId: driverId,
        notificationType: 4,
        editStatusFromBO: 'normalize',
      };

      await this.gateway.syncDriver(
        SpecificClient,
        user,
        date,
        notificationObj,
      );
      return res.status(normalizedResp.statusCode).send({
        statusCode: normalizedResp.statusCode,
        message: normalizedResp.message,
        data: normalizedResp.data,
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * @description : Test endpoint to get missing intermediates
   */
  @CreateMissingIntermediatesDecorator()
  async createMissingIntermediates(@Res() res, @Req() req) {
    const dutyStatuses = [
      {
        CYCLE_START_DATE: 1695190049,
        SHIFT_START_DATE: 1695190049,
        accumulatedEngineHours: '6195.5',
        accumulatedVehicleMiles: '240868',
        address: '',
        correspondingCmvOrderNumber: '1',
        dataDiagnosticEventIndicatorForDriver: '0',
        distanceSinceLastValidCoordinates: '0',
        eventCode: '1',
        eventDataCheckValue: 'B2',
        eventDate: '102923',
        eventEndTime: '',
        eventLatitude: '31.4688387',
        eventLongitude: '74.4509997',
        eventRecordOrigin: '2',
        eventRecordStatus: '1',
        eventSequenceIdNumber: '8484',
        eventTime: '000000',
        eventType: '1',
        lineDataCheckValue: '84',
        malfunctionIndicatorStatusForEld: '0',
        notes: '',
        state: 'Punjab',
        totalEngineHoursDutyStatus: '0',
        totalVehicleMilesDutyStatus: '0',
        userOrderNumberForRecordOriginator: '1',
      },
      {
        CYCLE_START_DATE: 1695190049,
        SHIFT_START_DATE: 1695190049,
        accumulatedEngineHours: '6195.5',
        accumulatedVehicleMiles: '240868',
        address: '',
        correspondingCmvOrderNumber: '1',
        dataDiagnosticEventIndicatorForDriver: '0',
        distanceSinceLastValidCoordinates: '0',
        eventCode: '3',
        eventDataCheckValue: 'B2',
        eventDate: '102923',
        eventEndTime: '',
        eventLatitude: '31.4688387',
        eventLongitude: '74.4509997',
        eventRecordOrigin: '2',
        eventRecordStatus: '1',
        eventSequenceIdNumber: '8484',
        eventTime: '063000',
        eventType: '1',
        lineDataCheckValue: '84',
        malfunctionIndicatorStatusForEld: '0',
        notes: '',
        state: 'Punjab',
        totalEngineHoursDutyStatus: '0',
        totalVehicleMilesDutyStatus: '0',
        userOrderNumberForRecordOriginator: '1',
      },
      {
        CYCLE_START_DATE: 1695190049,
        SHIFT_START_DATE: 1695190049,
        accumulatedEngineHours: '6195.5',
        accumulatedVehicleMiles: '240868',
        address: '',
        correspondingCmvOrderNumber: '1',
        dataDiagnosticEventIndicatorForDriver: '0',
        distanceSinceLastValidCoordinates: '0',
        eventCode: '2',
        eventDataCheckValue: 'B2',
        eventDate: '102923',
        eventEndTime: '',
        eventLatitude: '31.4688387',
        eventLongitude: '74.4509997',
        eventRecordOrigin: '2',
        eventRecordStatus: '1',
        eventSequenceIdNumber: '8484',
        eventTime: '070000',
        eventType: '1',
        lineDataCheckValue: '84',
        malfunctionIndicatorStatusForEld: '0',
        notes: '',
        state: 'Punjab',
        totalEngineHoursDutyStatus: '0',
        totalVehicleMilesDutyStatus: '0',
        userOrderNumberForRecordOriginator: '1',
      },
      {
        CYCLE_START_DATE: 0,
        SHIFT_START_DATE: 0,
        accumulatedEngineHours: '1.8999999999996362',
        accumulatedVehicleMiles: '109',
        address: '1.60 mi N of Capac, MI',
        correspondingCmvOrderNumber: '1',
        dataDiagnosticEventIndicatorForDriver: '0',
        distanceSinceLastValidCoordinates: '0',
        eventCode: '3',
        eventDataCheckValue: '0E',
        eventDate: '102923',
        eventEndTime: '',
        eventLatitude: '42.9895417',
        eventLongitude: '-82.931085',
        eventRecordOrigin: '2',
        eventRecordStatus: '1',
        eventSequenceIdNumber: '79BE',
        eventTime: '093856',
        eventType: '1',
        lineDataCheckValue: '02',
        malfunctionIndicatorStatusForEld: '0',
        notes: '',
        state: 'Michigan',
        totalEngineHoursDutyStatus: '6195.5',
        totalVehicleMilesDutyStatus: '240868',
        userOrderNumberForRecordOriginator: '1',
        speed: '10.00',
        speedViolation: false,
      },
      // {
      //   CYCLE_START_DATE: 1695190049,
      //   SHIFT_START_DATE: 1695190049,
      //   accumulatedEngineHours: '0',
      //   accumulatedVehicleMiles: '0',
      //   address: '0.16 mi S of Chelsea, MI',
      //   correspondingCmvOrderNumber: '1',
      //   dataDiagnosticEventIndicatorForDriver: '0',
      //   distanceSinceLastValidCoordinates: '0',
      //   eventCode: '1',
      //   eventDataCheckValue: 'B2',
      //   eventDate: '102923',
      //   eventEndTime: '',
      //   eventLatitude: '42.3202702',
      //   eventLongitude: '-84.0215899',
      //   eventRecordOrigin: '2',
      //   eventRecordStatus: '1',
      //   eventSequenceIdNumber: '27A9',
      //   eventTime: '104000',
      //   eventType: '1',
      //   lineDataCheckValue: '84',
      //   malfunctionIndicatorStatusForEld: '0',
      //   notes: '',
      //   state: 'Punjab',
      //   totalEngineHoursDutyStatus: '6197.4',
      //   totalVehicleMilesDutyStatus: '240977',
      //   userOrderNumberForRecordOriginator: '1',
      // },
      {
        CYCLE_START_DATE: 0,
        SHIFT_START_DATE: 0,
        accumulatedEngineHours: '1.8999999999996362',
        accumulatedVehicleMiles: '109',
        address: '1.60 mi N of Capac, MI',
        correspondingCmvOrderNumber: '1',
        dataDiagnosticEventIndicatorForDriver: '0',
        distanceSinceLastValidCoordinates: '0',
        eventCode: '1',
        eventDataCheckValue: '0E',
        eventDate: '102923',
        eventEndTime: '',
        eventLatitude: '42.9895417',
        eventLongitude: '-82.931085',
        eventRecordOrigin: '2',
        eventRecordStatus: '1',
        eventSequenceIdNumber: '79BE',
        eventTime: '105000',
        eventType: '3',
        lineDataCheckValue: '02',
        malfunctionIndicatorStatusForEld: '0',
        notes: '',
        state: 'Michigan',
        totalEngineHoursDutyStatus: '6195.5',
        totalVehicleMilesDutyStatus: '240868',
        userOrderNumberForRecordOriginator: '1',
        speed: '10.00',
        speedViolation: false,
      },
      {
        CYCLE_START_DATE: 1695190049,
        SHIFT_START_DATE: 1695190049,
        accumulatedEngineHours: '0',
        accumulatedVehicleMiles: '0',
        address: '0.16 mi S of Chelsea, MI',
        correspondingCmvOrderNumber: '1',
        dataDiagnosticEventIndicatorForDriver: '0',
        distanceSinceLastValidCoordinates: '0',
        eventCode: '1',
        eventDataCheckValue: 'B2',
        eventDate: '102923',
        eventEndTime: '',
        eventLatitude: '42.3202702',
        eventLongitude: '-84.0215899',
        eventRecordOrigin: '2',
        eventRecordStatus: '1',
        eventSequenceIdNumber: '27A9',
        eventTime: '120000',
        eventType: '1',
        lineDataCheckValue: '84',
        malfunctionIndicatorStatusForEld: '0',
        notes: '',
        state: 'Punjab',
        totalEngineHoursDutyStatus: '6197.4',
        totalVehicleMilesDutyStatus: '240977',
        userOrderNumberForRecordOriginator: '1',
      },
    ];
    const response = await this.driverCsvService.calculateMissingIntermediates(
      dutyStatuses,
    );
    return res.status(200).send(response);
  }

  @InsertLogDriverCsvLogDecorator()
  async insertLogInfo(
    @Body() data: InsertLogInfoBodyDto,
    @Res() res,
    @Req() req,
  ) {
    Logger.log('In Insert Log DriverC sv Log Decorato Endpoint');

    const { driverId, date, time, type, sqID, signature, statusInfo } = data;
    const { tenantId, companyTimeZone, deviceToken, deviceType } =
      (req.user as any) ?? {
        tenantId: undefined,
      };
    const title = 'insert info  logs executed!';
    const notificationObj = {
      logs: [],
      dateTime: date,
      driverId: driverId,
      notificationType: 4,
      editStatusFromBO: 'insertInfoLog',
    };

    const messagePatternDriver =
      await firstValueFrom<MessagePatternResponseType>(
        this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
      );
    if (messagePatternDriver.isError) {
      mapMessagePatternResponseToException(messagePatternDriver);
    }
    const user = messagePatternDriver.data;
    const deviceInfo = {
      deviceToken: user.deviceToken,
      deviceType: user.deviceType,
    };
    const logsOfSelectedDate = await this.get_logs_between_range({
      driverId: driverId,
      startDate: date,
      endDate: date,
    });
    if (logsOfSelectedDate.length != 0) {
      if (type == '1') {
        if (Array.isArray(logsOfSelectedDate)) {
          //data available
          let dutyStatusLogs = JSON.parse(
            JSON.stringify(
              logsOfSelectedDate[0].csv
                .eldEventListForDriversRecordOfDutyStatus,
            ),
          );
          dutyStatusLogs = dutyStatusLogs.filter((element) => {
            return element.eventRecordStatus != '2';
          });
          if (statusInfo.eventType == '4' && statusInfo.eventCode == '1') {
            // log info is of certify

            const result = await firstValueFrom(
              this.reportClient.send(
                { cmd: 'certification' },
                { date, driverId, time, signature, companyTimeZone },
              ),
            );
            if (result) {
              console.log('about to dispatch notification');
              await dispatchNotification(
                title,
                notificationObj,
                deviceInfo,
                this.pushNotificationClient,
                true,
              );
              return res.status(200).send({
                statusCode: 200,
                message: 'Certification added Successfully',
                data: result,
              });
            } else {
              return res.status(404).send({
                statusCode: 404,
                message: 'Certification cannot be added',
                data: result,
              });
            }
          }

          if (statusInfo.eventType == '2' && statusInfo.eventCode == '1') {
            // log info is of intermedate driving

            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            insertIntermediat(
              dutyStatusLogs,
              foundLog,
              statusInfo,
              date,
              time,
              companyTimeZone,
            );
            logsOfSelectedDate[0].csv.eldEventListForDriversRecordOfDutyStatus =
              dutyStatusLogs;
            const result = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            // if (statusInfo.shippingDocument) {
            //   const ship = statusInfo.shippingDocument;
            //   let logform = await updateLogform(
            //     this.reportClient,
            //     ship,
            //     signature,
            //     driverId,
            //     date,
            //     companyTimeZone,
            //     '',
            //   );
            // }
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'Assertion successful',
              data: result,
            });
          }
          if (statusInfo.eventType == '2' && statusInfo.eventCode == '2') {
            // log info is of intermedate personal
            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            //selected log is other then driving
            insertIntermediat(
              dutyStatusLogs,
              foundLog,
              statusInfo,
              date,
              time,
              companyTimeZone,
            );
            logsOfSelectedDate[0].csv.eldEventListForDriversRecordOfDutyStatus =
              dutyStatusLogs;
            const result = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            if (statusInfo.shippingDocument || statusInfo.tralier) {
              const ship = statusInfo.shippingDocument;
              const logform = await updateLogform(
                this.reportClient,
                ship,
                signature,
                driverId,
                date,
                companyTimeZone,
                '',
              );
            }
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'Assertion successful',
              data: result,
            });
          }
          if (
            statusInfo.eventType == '5' &&
            (statusInfo.eventCode == '1' || statusInfo.eventCode == '2')
          ) {
            // log info is of login1 logout2
            const driverName = user.fullName;
            const loginlogout = JSON.parse(
              JSON.stringify(logsOfSelectedDate[0].csv.eldLoginLogoutReport),
            );
            insert_Login_Logout(
              loginlogout,
              statusInfo,
              date,
              time,
              driverName,
              companyTimeZone,
            );
            logsOfSelectedDate[0].csv.eldLoginLogoutReport = loginlogout;
            const result = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            if (statusInfo.shippingDocument || statusInfo.tralier) {
              const ship = statusInfo.shippingDocument;
              const logform = await firstValueFrom(
                this.reportClient.send(
                  { cmd: 'update_logform' },
                  {
                    from: '',
                    to: '',
                    ship,
                    signature,
                    driverId,
                    date,
                    companyTimeZone,
                  },
                ),
              );
            }
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'Assertion successful',
              data: result,
            });
          }
          if (
            statusInfo.eventType == '6' &&
            (statusInfo.eventCode == '1' || statusInfo.eventCode == '3')
          ) {
            // log info is of power up power down driving
            const poweruppowerdown = JSON.parse(
              JSON.stringify(
                logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity,
              ),
            );
            const eventTimePrevious =
              poweruppowerdown[poweruppowerdown.length - 1]?.eventTime;
            const cmvPowerUnitNumber =
              logsOfSelectedDate[0].csv.cmvList[0].cmvPowerUnitNumber;
            const cmvVin = logsOfSelectedDate[0].csv.cmvList[0].cmvVin;
            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            insert_powerup_powerdown(
              poweruppowerdown,
              statusInfo,
              date,
              time,
              cmvPowerUnitNumber,
              cmvVin,
              companyTimeZone,
            );
            logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity =
              poweruppowerdown;
            const today = moment.utc().tz(user.homeTerminalTimeZone.tzCode);
            const todayDate = today.toISOString().split('T')[0];
            if (
              todayDate != date &&
              time > (eventTimePrevious ? eventTimePrevious : 0)
            ) {
              let dateOfQuery = moment(logsOfSelectedDate[0].date);
              dateOfQuery = dateOfQuery.add(1, 'days'); // Use 'add' instead of 'subtract'
              const dateQuery = dateOfQuery.format('YYYY-MM-DD');
              const logsOfnextDate = await this.get_logs_between_range({
                driverId: driverId,
                startDate: dateQuery,
                endDate: dateQuery,
              });
              if (statusInfo.eventCode == '1') {
                logsOfnextDate[0].meta.powerUp = true;
              } else if (statusInfo.eventCode == '3') {
                logsOfnextDate[0].meta.powerUp = false;
              }
              // if (statusInfo.eventCode == '2' || statusInfo.eventCode == '1') {
              //   logsOfnextDate[0].meta.powerUp = true;
              // } else if (
              //   statusInfo.eventCode == '4' ||
              //   statusInfo.eventCode == '3'
              // ) {
              //   logsOfnextDate[0].meta.powerUp = false;
              // }
              const result = await this.driverCsvService.addToDB(
                logsOfnextDate[0],
                user,
              );
            }
            const result = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            if (statusInfo.shippingDocument || statusInfo.tralier) {
              const ship = statusInfo.shippingDocument;
              const logform = await firstValueFrom(
                this.reportClient.send(
                  { cmd: 'update_logform' },
                  {
                    from: '',
                    to: '',
                    ship,
                    signature,
                    driverId,
                    date,
                    companyTimeZone,
                  },
                ),
              );
            }
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'Assertion successful',
              data: result,
            });
          }
          if (
            statusInfo.eventType == '6' &&
            (statusInfo.eventCode == '2' || statusInfo.eventCode == '4')
          ) {
            // log info is of power up personal
            const poweruppowerdown = JSON.parse(
              JSON.stringify(
                logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity,
              ),
            );
            const eventTimePrevious =
              poweruppowerdown[poweruppowerdown.length - 1]?.eventTime;
            // let ccc = logsOfSelectedDate[0].csv.cmvList
            const cmvPowerUnitNumber =
              logsOfSelectedDate[0].csv.cmvList[0].cmvPowerUnitNumber;
            const cmvVin = logsOfSelectedDate[0].csv.cmvList[0].cmvVin;

            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            insert_powerup_powerdown(
              poweruppowerdown,
              statusInfo,
              date,
              time,
              cmvPowerUnitNumber,
              cmvVin,
              companyTimeZone,
            );
            const today = moment.utc().tz(user.homeTerminalTimeZone.tzCode);
            const todayDate = today.toISOString().split('T')[0];
            if (
              todayDate != date &&
              time > (eventTimePrevious ? eventTimePrevious : 0)
            ) {
              let dateOfQuery = moment(logsOfSelectedDate[0].date);
              dateOfQuery = dateOfQuery.add(1, 'days'); // Use 'add' instead of 'subtract'
              const dateQuery = dateOfQuery.format('YYYY-MM-DD');
              const logsOfnextDate = await this.get_logs_between_range({
                driverId: driverId,
                startDate: dateQuery,
                endDate: dateQuery,
              });
              if (statusInfo.eventCode == '2') {
                logsOfnextDate[0].meta.powerUp = true;
              } else if (
                statusInfo.eventCode == '4' ||
                statusInfo.eventCode == '3'
              ) {
                logsOfnextDate[0].meta.powerUp = false;
              }
              // if (statusInfo.eventCode == '2' || statusInfo.eventCode == '1') {
              //   logsOfnextDate[0].meta.powerUp = true;
              // } else if (
              //   statusInfo.eventCode == '4' ||
              //   statusInfo.eventCode == '3'
              // ) {
              //   logsOfnextDate[0].meta.powerUp = false;
              // }
              const result = await this.driverCsvService.addToDB(
                logsOfnextDate[0],
                user,
              );
            }
            logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity =
              poweruppowerdown;
            const result = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            if (statusInfo.shippingDocument || statusInfo.tralier) {
              const ship = statusInfo.shippingDocument;
              const logform = await firstValueFrom(
                this.reportClient.send(
                  { cmd: 'update_logform' },
                  {
                    from: '',
                    to: '',
                    ship,
                    signature,
                    driverId,
                    date,
                    companyTimeZone,
                  },
                ),
              );
            }
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'Assertion successful',
              data: result,
            });
          }
        } // check if there is some error happen
        else {
          return res.status(404).send({
            statusCode: 404,
            message: 'Data  not found!',
            data: [],
          });
        }
      } else {
        if (sqID) {
          let dutyStatusLogs = JSON.parse(
            JSON.stringify(
              logsOfSelectedDate[0].csv
                .eldEventListForDriversRecordOfDutyStatus,
            ),
          );
          dutyStatusLogs = dutyStatusLogs.filter((element) => {
            return element.eventRecordStatus != '2';
          });
          if (statusInfo.eventType == '4' && statusInfo.eventCode == '1') {
            // log info is of certify
            const certificationRecods = JSON.parse(
              JSON.stringify(
                logsOfSelectedDate[0].csv
                  .eldEventListForDriverCertificationOfOwnRecords,
              ),
            );

            const result = await removeObjectByEventSequenceId(
              certificationRecods,
              sqID,
            );
            if (result) {
              result.eventTime = time;
              certificationRecods.push(result);
              logsOfSelectedDate[0].csv.eldEventListForDriverCertificationOfOwnRecords =
                certificationRecods;
              const resp = await this.driverCsvService.addToDB(
                logsOfSelectedDate[0],
                user,
              );
              console.log('about to dispatch notification');
              await dispatchNotification(
                title,
                notificationObj,
                deviceInfo,
                this.pushNotificationClient,
                true,
              );
              return res.status(200).send({
                statusCode: 200,
                message: 'Certification updated successfully',
                data: result,
              });
            } else {
              return res.status(404).send({
                statusCode: 404,
                message: 'Certification cannot be added',
                data: result,
              });
            }
          }

          if (statusInfo.eventType == '2' && statusInfo.eventCode == '1') {
            // log info is of intermedate driving

            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            const result = await removeObjectByEventSequenceId(
              dutyStatusLogs,
              sqID,
            );
            let intType;
            if (foundLog.eventCode == '1' && foundLog.eventType == '3') {
              intType = '2';
            }
            if (foundLog.eventCode == '2' && foundLog.eventType == '3') {
              intType = '3';
            }
            if (foundLog.eventCode == '3' && foundLog.eventType == '1') {
              intType = '1';
            }
            result.intermediateType = intType;
            result.eventTime = time;
            result.address = statusInfo.address;
            result.eventLatitude = statusInfo.lat;
            result.eventLongitude = statusInfo.long;
            result.totalVehicleMilesDutyStatus = statusInfo.odometer;
            result.totalEngineHoursDutyStatus = statusInfo.engineHour;
            result.notes = statusInfo.notes;
            dutyStatusLogs.push(result);
            dutyStatusLogs = dutyStatusLogs.sort((a, b) =>
              a.eventTime.localeCompare(b.eventTime),
            );
            // if (statusInfo.shippingDocument) {
            //   const ship = statusInfo.shippingDocument;
            //   let logform = await updateLogform(
            //     this.reportClient,
            //     ship,
            //     signature,
            //     driverId,
            //     date,
            //     companyTimeZone,
            //     '',
            //   );
            // }
            logsOfSelectedDate[0].csv.eldEventListForDriversRecordOfDutyStatus =
              dutyStatusLogs;
            const resp = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'update successful',
              data: result,
            });
          }
          if (statusInfo.eventType == '2' && statusInfo.eventCode == '2') {
            // log info is of intermedate personal
            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            const result = await removeObjectByEventSequenceId(
              dutyStatusLogs,
              sqID,
            );
            let intType;
            if (foundLog.eventCode == '1' && foundLog.eventType == '3') {
              intType = '2';
            }
            if (foundLog.eventCode == '2' && foundLog.eventType == '3') {
              intType = '3';
            }
            if (foundLog.eventCode == '3' && foundLog.eventType == '1') {
              intType = '1';
            }
            result.intermediateType = intType;
            result.eventTime = time;
            result.address = statusInfo.address;
            result.eventLatitude = statusInfo.lat;
            result.eventLongitude = statusInfo.long;
            result.totalVehicleMilesDutyStatus = statusInfo.odometer;
            result.totalEngineHoursDutyStatus = statusInfo.engineHour;
            result.notes = statusInfo.notes;
            dutyStatusLogs.push(result);
            dutyStatusLogs = dutyStatusLogs.sort((a, b) =>
              a.eventTime.localeCompare(b.eventTime),
            );
            // if (statusInfo.shippingDocument) {
            //   const ship = statusInfo.shippingDocument;
            //   let logform = await updateLogform(
            //     this.reportClient,
            //     ship,
            //     signature,
            //     driverId,
            //     date,
            //     companyTimeZone,
            //     '',
            //   );
            // }
            logsOfSelectedDate[0].csv.eldEventListForDriversRecordOfDutyStatus =
              dutyStatusLogs;
            const resp = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'update successful',
              data: result,
            });
          }
          if (
            statusInfo.eventType == '5' &&
            (statusInfo.eventCode == '1' || statusInfo.eventCode == '2')
          ) {
            // log info is of login1 logout2
            const driverName = user.fullName;
            let loginlogout = JSON.parse(
              JSON.stringify(logsOfSelectedDate[0].csv.eldLoginLogoutReport),
            );
            const result = await removeObjectByEventSequenceId(
              loginlogout,
              sqID,
            );
            result.eventTime = time;
            result.address = statusInfo.address;
            result.loginLatitude = statusInfo.lat;
            result.loginLongitude = statusInfo.long;
            let odometer;
            let Ehours;
            if (Number(statusInfo.odometer) > Number('9999999')) {
              odometer = '9999999';
            } else {
              odometer = statusInfo.odometer;
            }
            if (Number(statusInfo.engineHour) > Number('99999.9')) {
              Ehours = '99999.9';
            } else {
              Ehours = statusInfo.engineHour;
            }
            result.totalEngineHours = Ehours;
            result.totalVehicleMiles = odometer;
            result.totalVehicleMilesDutyStatus = statusInfo.odometer;
            result.totalEngineHoursDutyStatus = statusInfo.engineHour;
            result.notes = statusInfo.notes;
            loginlogout.push(result);
            loginlogout = loginlogout.sort((a, b) =>
              a.eventTime.localeCompare(b.eventTime),
            );
            // if (statusInfo.shippingDocument) {
            //   const ship = statusInfo.shippingDocument;
            //   let logform = await updateLogform(
            //     this.reportClient,
            //     ship,
            //     signature,
            //     driverId,
            //     date,
            //     companyTimeZone,
            //     '',
            //   );
            // }
            logsOfSelectedDate[0].csv.eldLoginLogoutReport = loginlogout;
            const resp = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'update successful',
              data: result,
            });
          }
          if (
            statusInfo.eventType == '6' &&
            (statusInfo.eventCode == '1' || statusInfo.eventCode == '3')
          ) {
            // log info is of power up power down driving
            let poweruppowerdown = JSON.parse(
              JSON.stringify(
                logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity,
              ),
            );
            const { cmvPowerUnitNumber, cmvVin } =
              logsOfSelectedDate[0].csv.cmvList;
            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            const result = await removeObjectByEventSequenceId(
              poweruppowerdown,
              sqID,
            );
            result.eventTime = time;
            result.address = statusInfo.address;
            result.eventLatitude = statusInfo.lat;
            result.eventLongitude = statusInfo.long;
            let odometer;
            let Ehours;
            if (Number(statusInfo.odometer) > Number('9999999')) {
              odometer = '9999999';
            } else {
              odometer = statusInfo.odometer;
            }
            if (Number(statusInfo.engineHour) > Number('99999.9')) {
              Ehours = '99999.9';
            } else {
              Ehours = statusInfo.engineHour;
            }
            result.totalEngineHours = Ehours;
            result.totalVehicleMiles = odometer;
            result.totalVehicleMilesDutyStatus = statusInfo.odometer;
            result.totalEngineHoursDutyStatus = statusInfo.engineHour;
            result.notes = statusInfo.notes;
            poweruppowerdown.push(result);
            poweruppowerdown = poweruppowerdown.sort((a, b) =>
              a.eventTime.localeCompare(b.eventTime),
            );
            logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity =
              poweruppowerdown;
            const resp = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            if (statusInfo.shippingDocument || statusInfo.tralier) {
              const ship = statusInfo.shippingDocument;
              const logform = await firstValueFrom(
                this.reportClient.send(
                  { cmd: 'update_logform' },
                  {
                    from: '',
                    to: '',
                    ship,
                    signature,
                    driverId,
                    date,
                    companyTimeZone,
                  },
                ),
              );
            }
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'update successful',
              data: result,
            });
          }
          if (
            statusInfo.eventType == '6' &&
            (statusInfo.eventCode == '2' || statusInfo.eventCode == '4')
          ) {
            let poweruppowerdown = JSON.parse(
              JSON.stringify(
                logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity,
              ),
            );
            const { cmvPowerUnitNumber, cmvVin } =
              logsOfSelectedDate[0].csv.cmvList;
            const { foundLog, index } = await getLog(dutyStatusLogs, time);

            const result = await removeObjectByEventSequenceId(
              poweruppowerdown,
              sqID,
            );
            result.eventTime = time;
            result.address = statusInfo.address;
            result.eventLatitude = statusInfo.lat;
            result.eventLongitude = statusInfo.long;
            let odometer;
            let Ehours;
            if (Number(statusInfo.odometer) > Number('9999999')) {
              odometer = '9999999';
            } else {
              odometer = statusInfo.odometer;
            }
            if (Number(statusInfo.engineHour) > Number('99999.9')) {
              Ehours = '99999.9';
            } else {
              Ehours = statusInfo.engineHour;
            }
            result.totalEngineHours = Ehours;
            result.totalVehicleMiles = odometer;
            result.totalVehicleMilesDutyStatus = statusInfo.odometer;
            result.totalEngineHoursDutyStatus = statusInfo.engineHour;
            result.notes = statusInfo.notes;
            poweruppowerdown.push(result);
            poweruppowerdown = poweruppowerdown.sort((a, b) =>
              a.eventTime.localeCompare(b.eventTime),
            );
            logsOfSelectedDate[0].csv.cmvEnginePowerUpShutDownActivity =
              poweruppowerdown;
            const resp = await this.driverCsvService.addToDB(
              logsOfSelectedDate[0],
              user,
            );
            if (statusInfo.shippingDocument || statusInfo.tralier) {
              const ship = statusInfo.shippingDocument;
              const logform = await firstValueFrom(
                this.reportClient.send(
                  { cmd: 'update_logform' },
                  {
                    from: '',
                    to: '',
                    ship,
                    signature,
                    driverId,
                    date,
                    companyTimeZone,
                  },
                ),
              );
            }
            console.log('about to dispatch notification');
            await dispatchNotification(
              title,
              notificationObj,
              deviceInfo,
              this.pushNotificationClient,
              true,
            );
            return res.status(200).send({
              statusCode: 200,
              message: 'update successful',
              data: result,
            });
          }
        } else {
          return res.status(404).send({
            statusCode: 404,
            message: 'please Provide Sequence ID',
            data: [],
          });
        }
      }
      console.log('about to dispatch notification');
      await dispatchNotification(
        title,
        notificationObj,
        deviceInfo,
        this.pushNotificationClient,
        true,
      );
    } else {
      return res.status(200).send({
        statusCode: 200,
        message: 'Please login from mobile first',
        data: [],
      });
    }
  }
  @InsertDutyStatusDecorator()
  async insertDutyStatus(
    @Body() data: InsertDutyStatusDTO,
    @Res() res,
    @Req() req,
  ) {
    try {
      const {
        driverId,
        date,
        startTime,
        endTime,
        eventType,
        eventCode,
        lat,
        long,
        address,
        odometer,
        engineHour,
        truck,
        shippingDocument,
        tralier,
        notes,
        state,
      } = data;
      const { tenantId, companyTimeZone } = (req.user as any) ?? {
        tenantId: undefined,
      };
      const messagePatternDriver =
        await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
        );
      if (messagePatternDriver.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }
      const user = messagePatternDriver.data;
      const logsOfSelectedDate = await this.get_logs_between_range({
        driverId: driverId,
        startDate: date,
        endDate: date,
      });
      if (Array.isArray(logsOfSelectedDate)) {
        //data available
        let dutyStatusLogs = JSON.parse(
          JSON.stringify(
            logsOfSelectedDate[0].csv.eldEventListForDriversRecordOfDutyStatus,
          ),
        );
        const inActiveLogs = dutyStatusLogs.filter((element) => {
          return element.eventRecordStatus == '2';
        });
        dutyStatusLogs = dutyStatusLogs.filter((element) => {
          return element.eventRecordStatus != '2';
        });
        const { filterd, arr } = await getInBetweenLogs(
          dutyStatusLogs,
          startTime,
          endTime,
        );
        let addedLogs = JSON.parse(
          JSON.stringify(
            await addFirstandLast(arr, filterd, startTime, endTime),
          ),
        );
        const newLog = await createNewLog(
          startTime,
          date,
          endTime,
          eventType,
          eventCode,
          lat,
          long,
          address,
          odometer,
          engineHour,
          truck,
          shippingDocument,
          tralier,
          companyTimeZone,
          notes,
          state,
        );
        addedLogs = await insertLog(addedLogs, newLog, startTime, endTime);
        addedLogs = addedLogs.sort((a, b) =>
          a.eventTime.localeCompare(b.eventTime),
        );
        function findLogIndexByEventTime(logs, eventTime) {
          for (let i = 0; i < logs.length; i++) {
            if (logs[i].eventTime === eventTime) {
              return i;
            }
          }
          return -1; // Return -1 if the log with the specified eventTime is not found
        }

        addedLogs.sort((a, b) => a.eventTime.localeCompare(b.eventTime));

        // const index = findLogIndexByEventTime(addedLogs, startTime)
        // if (index != addedLogs.length - 1) {
        //   addedLogs[index + 1].eventTime = endTime

        // }
        let finalLogs = await removeDuplicateConsecutiveLogs(addedLogs);
        finalLogs = [...finalLogs, ...inActiveLogs];
        addedLogs.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
        const csv = JSON.parse(JSON.stringify(logsOfSelectedDate[0].csv));
        csv.eldEventListForDriversRecordOfDutyStatus = finalLogs;
        // if (shippingDocument || tralier) {
        //   const ship = shippingDocument;
        //   let logform = await firstValueFrom(
        //     this.reportClient.send(
        //       { cmd: 'update_logform' },
        //       { from: '', to: '', ship, driverId, date, companyTimeZone },
        //     ),
        //   );
        // }

        // let recordMade = {
        //   driverId: "6523f329c0d7b8197bfc7fbc",
        //   date: "2023-10-25",
        //   driverName: "Sharif",
        //   vehicleName: "1998",
        //   shippingId: "erfdf",
        //   signature: "",
        //   hoursWorked: 19220020,
        //   distance: "0",
        // }

        // let record = await this.driverCsvService.addAndUpdateDriverRecord(recordMade)//add record
        // let da = await this.driverCsvService.findByDriveAndDate(["6523f329c0d7b8197bfc7fbc","6523f329c0d7b8197bfc7fba"],"2023-10-24")//get records

        return res.status(200).send({
          statusCode: 200,
          message: '',
          data: csv,
        });
      }
    } catch (error) {
      throw error;
    }
  }
  @getLocationDecorators()
  async getLocation(
    @Query('lat') lat: string,
    @Query('long') long: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    const address = await this.driverCsvService.getAddress(lat, long);
    if (address.length > 0) {
      const splitAd = address.split(',');
      let adState = splitAd[splitAd.length - 1].trim();
      const states = {
        Alabama: 'AL',
        Alaska: 'AK',
        Arizona: 'AZ',
        Arkansas: 'AR',
        'American Samoa': 'AS',
        California: 'CA',
        Colorado: 'CO',
        Connecticut: 'CT',
        Delaware: 'DE',
        'District of Columbia': 'DC',
        Florida: 'FL',
        Georgia: 'GA',
        Guam: 'GU',
        Hawaii: 'HI',
        Idaho: 'ID',
        Illinois: 'IL',
        Indiana: 'IN',
        Iowa: 'IA',
        Kansas: 'KS',
        Kentucky: 'KY',
        Louisiana: 'LA',
        Maine: 'ME',
        Maryland: 'MD',
        Massachusetts: 'MA',
        Michigan: 'MI',
        Minnesota: 'MN',
        Mississippi: 'MS',
        Missouri: 'MO',
        Montana: 'MT',
        Nebraska: 'NE',
        Nevada: 'NV',
        'New Hampshire': 'NH',
        'New Jersey': 'NJ',
        'New Mexico': 'NM',
        'New York': 'NY',
        'North Carolina': 'NC',
        'North Dakota': 'ND',
        'Northern Mariana Islands': 'MP',
        Ohio: 'OH',
        Oklahoma: 'OK',
        Oregon: 'OR',
        Pennsylvania: 'PA',
        'Puerto Rico': 'PR',
        'Rhode Island': 'RI',
        'South Carolina': 'SC',
        'South Dakota': 'SD',
        Tennessee: 'TN',
        Texas: 'TX',
        'United States Minor Outlying Islands': 'UM',
        'United States Virgin Islands': 'USVI',
        Utah: 'UT',
        Vermont: 'VT',
        Virginia: 'VA',
        Washington: 'WA',
        'West Virginia': 'WV',
        Wisconsin: 'WI',
        Wyoming: 'WY',
        'Azad Jammu and Kashmir': 'AJK',
        Balochistan: 'BA',
        'Gilgit-Baltistan': 'GB',
        'Islamabad Capital Territory': 'ICT',
        'Khyber Pakhtunkhwa': 'KP',
        Punjab: 'PB',
        Sindh: 'SD',
      };
      function isValueInObject(obj, targetValue) {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (obj[key] === targetValue) {
              return key; // The target value is found in the object
            }
          }
        }
        return targetValue; // The target value is not found in the object
      }
      if (adState.length <= 3) {
        adState = isValueInObject(states, adState);
      }
      const resp = { address: address, state: adState };
      return response.status(200).send({
        statusCode: 200,
        message: 'address ',
        data: resp,
      });
    }
    return response.status(200).send({
      statusCode: 404,
      message: 'no address found please provide valid latitude longitude ',
      data: {},
    });
  }

  @getLatLngFromAddressDecorator()
  async getLatLngFromAddress(
    @Query('address') address: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      const addressStr = address;
      const data = await googleGeocode(null, null, addressStr);

      // response object modification according to data found or not
      const responseObj = {
        statusCode: 200,
        message:
          data || data?.geometry
            ? 'Converted address to lat lng!'
            : 'Invalid location passed!',
        formatedAddress: address,
        data:
          data || data?.geometry
            ? {
                lat: (data?.geometry?.location.lat).toFixed(6),
                lng: data?.geometry?.location.lng.toFixed(6),
              }
            : {},
      };

      return response.send(responseObj);
    } catch (error) {
      throw error;
    }
  }

  @GetDriverRecords()
  async getRecordsTable(
    @Query() queryParams,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      const { date } = queryParams;

      const resp = await this.driverCsvService.findByDriveAndDate(
        [],
        queryParams,
      ); //get records

      return response.status(200).send({
        statusCode: 200,
        message: 'Sucessfully list got',
        data: resp,
      });
    } catch (error) {
      throw error;
    }
  }
}
