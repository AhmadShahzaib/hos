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
import { Server, Socket } from 'socket.io';
import { JwtPayload } from 'jsonwebtoken';
import {
  SocketManagerService,
  MessagePatternResponseType,
  mapMessagePatternResponseToException,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { DriverCsvService } from 'services/driverCsv.service';
import { AppService } from '../services/app.service';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { firstValueFrom, filter } from 'rxjs';

@WebSocketGateway()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject('DriverCsvService')
    private readonly driverCsvService: DriverCsvService,
    private readonly socketManager: SocketManagerService,
    @Inject('UNIT_SERVICE') private readonly unitClient: ClientProxy,
    @Inject('DRIVER_SERVICE') private readonly driverClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
    @Inject('AppService') private readonly HOSService: AppService,
  ) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket, ...args: any[]) {
    // Access the authorization token from the client's handshake
    const tokenPayload: JwtPayload = await this.socketManager.validateToken(
      client.handshake.headers.authorization,
    );
    const user = JSON.parse(tokenPayload.sub);
    console.log('New client connected with token:');
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected');
  }
  @SubscribeMessage('getOrignal')
  async getOrignalLogs(@MessageBody() queryParams: any): Promise<any> {
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
      let driverId = queryParams.id;
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
      let query = {
        start: inputDate,
        end: inputDate,
      };
      let response = await this.driverCsvService.getFromDB(query, user);
      if (!response.graphData[0].originalLogs) {
        this.server.emit('message', {
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
      let resp = {
        csvBeforeUpdate: { csv: csv, violations: violations },
      };
      this.server.emit('message',{
        message: 'Success',
        data: resp,
      });
    } catch (error) {
      throw error;
    }
  }

  @SubscribeMessage('getLive')
  async handleMessage(@MessageBody() request: any): Promise<any> {
    try {
      const { body, user, id } = request;

      if (id) {
        const messagePatternUnits = await firstValueFrom(
          this.unitClient.send({ cmd: 'get_unit_by_vehicleID' }, id),
        );
      }
      const messagePatternUnits =
        await firstValueFrom<MessagePatternResponseType>(
          this.unitClient.send({ cmd: 'assign_meta_to_units' }, { body, user }),
        );
      let reply = {
        message: 'Entry rejected ',
        data: {},
        statusCode: 400,
      };
      if (messagePatternUnits.isError) {
        mapMessagePatternResponseToException(messagePatternUnits);
      } else {
        this.server.emit('message', reply);
      }
      reply.message = 'Entry Added Successfully';
      reply.statusCode = 201;

      this.server.emit('message', reply);
    } catch (error) {
      this.server.emit('message', {
        message: error,
        data: {},
        statusCode: 400,
      });
    }

    // Broadcast the received message to all connected clients
  }
}
