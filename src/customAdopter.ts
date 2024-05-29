import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import * as http from 'http';

export class CustomIoAdapter extends IoAdapter {
  constructor(private app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = http.createServer(this.app.getHttpAdapter().getInstance());
    const ioOptions: ServerOptions = {
      ...options,
      maxHttpBufferSize: 1e8, // 100MB
    };
    const io = super.createIOServer(port, ioOptions);
    return io;
  }
}
