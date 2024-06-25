import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
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
import {
  MessagePatternResponseType,
  mapMessagePatternResponseToException,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { SocketManagerService } from '@shafiqrathore/logeld-tenantbackend-common-future';
import {
  getDatesBetweenUnixTimestamps,
  isSameDay,
} from 'utils/getDatesBetweenUnixTimestamps';
import { Server, Socket } from 'socket.io';
import { sortLiveLocations } from 'utils/sortLiveLocations';
import { JwtPayload } from 'jsonwebtoken';
import { DriverCsvService } from 'services/driverCsv.service';
import { AppService } from '../services/app.service';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { firstValueFrom, filter } from 'rxjs';

@WebSocketGateway({ cors: true })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly socketManager: SocketManagerService,
    @Inject('DriverCsvService')
    private readonly driverCsvService: DriverCsvService,
    @Inject('UNIT_SERVICE') private readonly unitClient: ClientProxy,
    @Inject('DRIVER_SERVICE') private readonly driverClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
    @Inject('AppService') private readonly HOSService: AppService,
  ) {}

  @WebSocketServer() server: Server;
  private clients: Map<string, any> = new Map();
  async handleConnection(client: Socket, ...args: any[]) {
    // Access the authorization token from the client's handshake

    const tokenPayload: JwtPayload = await this.socketManager.validateToken(
      client.handshake.headers.authorization,
    );
    const user = JSON.parse(tokenPayload.sub);

    const objectClient: any = { id: user.id, client: client.id };
    // objectClient = JSON.stringify(objectClient);
    try {
      await firstValueFrom<MessagePatternResponseType>(
        this.driverClient.send({ cmd: 'update_driver_client' }, objectClient),
      );
    } catch (error) {
      console.error('Error handling connection:', error);
    }
    console.log('New client connected with token:');
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected');
  }

  @SubscribeMessage('getSync')
  async getSync(@MessageBody() queryParams: any): Promise<any> {
    try {
      const { query, params, driverId, socketId } = queryParams;

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
        user.client;
      } else {
        // SpecificClient.emit('syncResponse', {
        //   message: 'Please Add driver Id',
        //   data: {},
        // });
      }
      if (!user) {
        this.server.emit('syncResponse', {
          message: 'Failed as no data is available against DriverId',
          data: {},
        });
      }
      const SpecificClient = user.client;
      const result = await this.driverCsvService.runCalculationOnRecentHOS(
        query,
        user,
      );
      if (result == 2) {
        this.server.to(SpecificClient).emit('syncResponse', {
          message: 'Failed as no data is available',
          data: {},
        });
      }

      const resp: any = await this.driverCsvService.getFromDB(query, user);

      if (resp) {
        // this.server.to(socketId)
        this.server.to(SpecificClient).emit('syncResponse', {
          message: 'Success',
          data: resp,
        });
      } else {
        this.server.to(SpecificClient).emit('syncResponse', {
          message: 'Failure',
          data: {},
        });
      }
    } catch (error) {
      this.server.emit('syncResponse', {
        message: error.message,
        data: error,
      });
    }
  }
  async notifyDriver(
    SpecificClient,
    mesaage,
    responseMessage,
    responseData,
  ): Promise<any> {
    return await this.server.to(SpecificClient).emit(mesaage, {
      message: responseMessage,
      data: responseData,
    });
  }

  async syncDriver(SpecificClient, user, date, responseData): Promise<any> {
    const end = moment().tz(user.homeTerminalTimeZone.tzCode);
    const query = { start: date, end: end.format('YYYY-MM-DD') };

    const resp: any = await this.driverCsvService.getFromDB(query, user);

    if (resp) {
      Logger.log('sending sync');
      if (!SpecificClient) {
        SpecificClient = user.client;
        Logger.log(user.client);
      }
      Logger.log(SpecificClient);

      // this.server.to(socketId)
      this.server.to(SpecificClient).emit('syncResponse', {
        message: 'Success',
        data: resp,
      });
    } else {
      this.server.to(SpecificClient).emit('syncResponse', {
        message: 'Failure',
        data: {},
      });
    }
  }

  @SubscribeMessage('addLocation')
  async addLiveLocation(
    @MessageBody()
    data,
  ) {
    try {
      const { queryParams, reqBody } = data;

      let user;
      let { meta } = reqBody;
      const { historyOfLocation } = reqBody;
      const { date, driverId } = queryParams;
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
      const SpecificClient = user.client;
      const tenantId = user.tenantId;

      // Ascending order sorting wrt to date time
      const sortedArray = await sortLiveLocations(historyOfLocation);

      //  Get recent location
      const recentHistory = sortedArray[sortedArray.length - 1];

      // Meta object creation
      if (meta?.address == '') {
        delete recentHistory?.address;
      }
      if (!meta) {
        meta = {};
      }
      meta['lastActivity'] = {
        odoMeterMillage: recentHistory?.odometer,
        engineHours: recentHistory?.engineHours,
        currentTime: recentHistory?.time,
        currentDate: recentHistory?.date,
        latitude: recentHistory?.latitude,
        longitude: recentHistory?.longitude,
        address: recentHistory?.address,
        speed: recentHistory?.speed,
        currentEventCode: recentHistory?.status || '1',
        currentEventType: recentHistory?.eventType,
        fuel: recentHistory?.fuel,
        coolantLevel: recentHistory?.coolantLevel,
        coolantTemperature: recentHistory?.coolantTemperature,
        oilLevel: recentHistory?.oilLevel,
        oilTemprature: recentHistory?.oilTemprature,
      };
      user.id = user.id ? user.id : user._id;
      // Assign recent location to units by message pattern
      const messagePatternUnits =
        await firstValueFrom<MessagePatternResponseType>(
          this.unitClient.send({ cmd: 'assign_meta_to_units' }, { meta, user }),
        );
      if (messagePatternUnits.isError) {
        mapMessagePatternResponseToException(messagePatternUnits);
      }

      // Pass related data to the model
      const response = await this.HOSService.addLiveLocation({
        driverId: driverId,
        tenantId,
        date,
        historyOfLocation: sortedArray,
      }); // await removed
      this.server.to(SpecificClient).emit('locationAdd', {
        message: 'entry added successfully',
        data: {},
      });
    } catch (error) {
      throw error;
    }
  }
  // only message for BO to keep track of change in status
  // not complete blocker od client id
  @SubscribeMessage('allcurrentStatuses')
  async getAllCurrentStatuses(
    @MessageBody()
    tenantId,
  ) {
    try {
      const messagePatternUnits =
        await firstValueFrom<MessagePatternResponseType>(
          this.unitClient.send({ cmd: 'get_all_current_statuses' }, tenantId),
        );
      if (messagePatternUnits.isError) {
        mapMessagePatternResponseToException(messagePatternUnits);
      }
    } catch (error) {
      throw error;
    }
  }
  @SubscribeMessage('addStops') //branch change
  async addStops(
    @MessageBody()
    data,
  ) {
    try {
      const { queryParams, reqBody } = data;

      let user;
      let { meta } = reqBody;
      const { historyOfLocation } = reqBody;
      const { date, driverId } = queryParams;
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
      const SpecificClient = user.client;
      const tenantId = user.tenantId;

      // Ascending order sorting wrt to date time
      const sortedArray = await sortLiveLocations(historyOfLocation);

      //  Get recent location
      const recentHistory = sortedArray[sortedArray.length - 1];

      // Meta object creation
      if (meta?.address == '') {
        delete recentHistory?.address;
      }
      if (!meta) {
        meta = {};
      }

      meta['lastActivity'] = {
        vehicleId : user.currentVehicle,
        odoMeterMillage: recentHistory?.odometer,
        engineHours: recentHistory?.engineHours,
        currentTime: recentHistory?.time,
        currentDate: recentHistory?.date,
        latitude: recentHistory?.latitude,
        longitude: recentHistory?.longitude,
        address: recentHistory?.address,
        speed: recentHistory?.speed,
        currentEventCode: recentHistory?.status || '1',
        currentEventType: recentHistory?.eventType,
        fuel: recentHistory?.fuel,
        coolantLevel: recentHistory?.coolantLevel,
        coolantTemperature: recentHistory?.coolantTemperature,
        oilLevel: recentHistory?.oilLevel,
        oilTemprature: recentHistory?.oilTemprature,
      };
      user.id = user.id ? user.id : user._id;
      // Assign recent location to units by message pattern
      const messagePatternUnits =
        await firstValueFrom<MessagePatternResponseType>(
          this.unitClient.send({ cmd: 'assign_meta_to_units' }, { meta, user }),
        );
      if (messagePatternUnits.isError) {
        mapMessagePatternResponseToException(messagePatternUnits);
      }

      // Pass related data to the model
      const response = await this.HOSService.addStops({
        driverId: driverId,
        tenantId,
        date,
        historyOfLocation: sortedArray,
      }); // await removed
      this.server.to(SpecificClient).emit('locationAdd', {
        message: 'entry added successfully',
        data: {},
      });
    } catch (error) {
      throw error;
    }
  }
  @SubscribeMessage('addSync')
  async addDataDriver(@MessageBody() queryParams: any): Promise<any> {
    try {
      const { body, driverId } = queryParams;
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
        // this.server.to(SpecificClient).emit('dataAddResp', {
        //   message: 'Please Add driver Id',
        //   data: {},
        // });
      }
      const SpecificClient = user.client;
      if (!user) {
        this.server.to(SpecificClient).emit('dataAddResp', {
          message: 'Failed as no data is available against DriverId',
          data: {},
        });
      }
      if (!body.meta) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message: 'Entry in meta is rejected as meta is not available',
          data: {},
        });
      }
      if (!body.meta.deviceCalculations) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message: 'Entry in  rejected as deviceCalculations is not available',
          data: {},
        });
      }
      if (!body.meta.dateTime) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message:
            'Entry in  rejected as deviceCalculations.isDataFound is not available',
          data: {},
        });
      }
      if (!body.csv) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message: 'Entry in meta is rejected as csv is not available',
          data: {},
        });
      }
      if (!body.csv.timePlaceLine) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message:
            'Entry in meta is rejected as csv timeplaceline is not available',
          data: {},
        });
      }
      if (!body.meta.pti) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message: 'Entry in meta is rejected as PTI is not available',
          data: {},
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
      // 2. if true
      /**
       * add to db
       */
      const csvPresent = isSameDay(body.meta.dateTime, body.meta.dateTime);

      if (recentCSV != 2) {
        if (recentCSV.length == 0) {
          const datesBetween = getDatesBetweenUnixTimestamps(
            moment().subtract(14, 'day').unix(),
            moment().subtract(1, 'day').unix(),
            user.homeTerminalTimeZone.tzCode,
          );
          const messagePatternUnit =
            await firstValueFrom<MessagePatternResponseType>(
              this.unitClient.send({ cmd: 'get_unit_by_driverId' }, user.id),
            );
          if (messagePatternUnit.isError) {
            Logger.log(`Error while finding unit against driver`);
            mapMessagePatternResponseToException(messagePatternUnit);
          }
          console.log(`All date of  ---- >>> `, datesBetween);
          for (const date of datesBetween) {
            Logger.log('Date +++++++++++++++++ \n\n\n' + date);
            reqBody = await this.driverCsvService.createMissingCSV(
              previousBody,
              user,
              date,
            );
            // console.log(`In add date of  ---- >>> `, date);
            await this.driverCsvService.addToDB(reqBody, user);

            // This code is to tpdate driver record need to add messagepattern to get unit  =  get_unit_by_driverId
            await this.driverCsvService.updateRecordMade(user, reqBody);
          }
        }
      }

      resp = await this.driverCsvService.addToDB(body, user);
      if (resp?.error) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message: resp.message,
          data: {},
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
      let query = {
        start: body.date,
        end: moment().tz(user.homeTerminalTimeZone.tzCode).format('YYYY-MM-DD'),
      };
      const result = await this.driverCsvService.runCalculationOnDateHOS(
        query,
        user,
      );
      query = {
        start: body.date,
        end: body.date,
      };
      const respo: any = await this.driverCsvService.getFromDB(query, user);
      if (resp) {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message: 'Entry Added Successfully',
          data: respo.graphData[0].meta,
        });
      } else {
        return this.server.to(SpecificClient).emit('dataAddResp', {
          message: resp,
        });
      }
    } catch (error) {
      return this.server.emit('dataAddResp', {
        message: error,
      });
    }
  }

  @SubscribeMessage('getOrignal')
  async getOrignalLogs(@MessageBody() queryParams: any): Promise<any> {
    try {
      //  const response = await this.HOSService.getOrignalLogs(queryParams);
      console.log('i am here in orignal');
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
      const SpecificClient = user.client;
      const inputDate = moment(queryParams.date).format('YYYY-MM-DD');
      const query = {
        start: inputDate,
        end: inputDate,
      };
      const response = await this.driverCsvService.getFromDB(query, user);
      if (!response.graphData[0].originalLogs) {
        this.server.to(SpecificClient).emit('message', {
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
      this.server.to(SpecificClient).emit('sendOrignal', {
        message: 'Success',
        data: resp,
      });
    } catch (error) {
      throw error;
    }
  }
  // @SubscribeMessage('message')
  // async replyMessage(@MessageBody() queryParams: any): Promise<any> {
  //   // this.notifyDriver("h23b4h2b34r5jh4","sbndjfd","jnbwdjfbnfs"{},)
  //   this.server.emit('message', {
  //     message: 'Success',
  //     data: 'data is here',
  //   });
  // }
  // @SubscribeMessage('getLive')
  // async handleMessage(@MessageBody() request: any): Promise<any> {
  //   try {
  //     const { body, user, id } = request;

  //     if (id) {
  //       const messagePatternUnits = await firstValueFrom(
  //         this.unitClient.send({ cmd: 'get_unit_by_vehicleID' }, id),
  //       );
  //     }
  //     const messagePatternUnits =
  //       await firstValueFrom<MessagePatternResponseType>(
  //         this.unitClient.send({ cmd: 'assign_meta_to_units' }, { body, user }),
  //       );
  //     let reply = {
  //       message: 'Entry rejected ',
  //       data: {},
  //       statusCode: 400,
  //     };
  //     if (messagePatternUnits.isError) {
  //       mapMessagePatternResponseToException(messagePatternUnits);
  //     } else {
  //       this.server.emit('message', reply);
  //     }
  //     reply.message = 'Entry Added Successfully';
  //     reply.statusCode = 201;

  //     this.server.emit('message', reply);
  //   } catch (error) {
  //     this.server.emit('message', {
  //       message: error,
  //       data: {},
  //       statusCode: 400,
  //     });
  //   }

  //   // Broadcast the received message to all connected clients
  // }
}
