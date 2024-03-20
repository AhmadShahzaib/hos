import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketManagerService } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntry } from 'logs/types';
import { LogsService } from 'services/logs.service';
import { JwtPayload } from 'jsonwebtoken';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import LogsDocument from 'mongoDb/document/document';

@WebSocketGateway()
export class LogsSocketGateway implements OnGatewayConnection {
  constructor(
    private readonly socketManager: SocketManagerService,
    @InjectModel('driverLogs') private driverLogsModel: Model<LogsDocument>
  ) {}

  @WebSocketServer()
  server: Server;

  // @SubscribeMessage('addLog')
  // async handleMessage(
  //   @MessageBody() data: LogEntry | Array<LogEntry>,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   // Validate and decrypt access token here
  //   let logsService = new LogsService(this.driverLogsModel)
  //   try {
  //     const tokenPayload: JwtPayload = await this.socketManager.validateToken(
  //       client.handshake.headers.authorization,
  //     );
  //     const driver = JSON.parse(tokenPayload.sub);
  //     await logsService.createLogEntry(data, driver.id, driver.tenantId);
  //   } catch (error) {
  //     throw error
  //   } finally {
  //     logsService = null
  //   }
  // }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const tokenPayload: JwtPayload = await this.socketManager.validateToken(
        client.handshake.headers.authorization,
      );
      const user = JSON.parse(tokenPayload.sub);
      if (!user.isDriver) {
        client.disconnect();
      }
      const updated = await this.socketManager.updateSocketId(
        client.handshake.headers.authorization,
        client.id,
      );
    } catch (error) {
      throw new WsException(error)
    }
  }
}
