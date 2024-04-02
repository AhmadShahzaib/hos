import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
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
import { SocketManagerService } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { AppService } from '../services/app.service';


@WebSocketGateway()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
   
    constructor(private readonly socketManager: SocketManagerService, @Inject('AppService') private readonly HOSService: AppService,) {}

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

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any): void {
    this.server.emit('message', data); // Broadcast the received message to all connected clients
  }
}
