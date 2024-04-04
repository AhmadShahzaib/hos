import { Module, Injectable, Scope, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './services/app.service';
import { DriverCsvService } from './services/driverCsv.service';
import {
  ConfigurationService,
  MessagePatternResponseInterceptor,SocketManagerService,
  SharedModule,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { AppController } from './controllers/app.controller';
import { LogsController } from './controllers/logs.controller';
import { DriverCsvController } from './controllers/driverCsv.controller';
// import {WebsocketGateway } from './websocket/websocket.gateway'
import { Transport, ClientProxyFactory } from '@nestjs/microservices';
import {
  LogEditRequestHistorySchema,
  LogsSchema,
  DriverCsvSchema,
} from 'mongoDb/schema/schema';
// import { LogsSocketGateway } from 'gateway/socket.gateway';
import { LogsService } from 'services/logs.service';
import tunnel from 'tunnel-ssh';
import tunnelConfig from './tunnelConfig';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UnidentifiedLogsController } from 'controllers/unidentifiedLogs.controller';
import { UnidentifiedLogsService } from 'services/unidentifiedLogs.service';
import { UnidentifiedLogsSchema } from 'mongoDb/schema/unidentifiedLogs.schema';
import { EditInsertLogsSchema } from 'mongoDb/schema/editInsertLogsSchema';
import { EditInsertLogHistorySchema } from 'mongoDb/schema/editInsertLogHistorySchema';
import { DriverLiveLocationSchema } from 'mongoDb/schema/driverLiveLocation.schema';
import { HistorySchema } from 'mongoDb/schema/history.schema';
import { RecordTableSchema } from 'mongoDb/schema/recordTable.schema';
// import { WebsocketModule } from './websocket/websocket.module';
import { WebsocketGateway } from './websocket/websocket.gateway';

const getProxyObject = (
  proxyName: string,
  hostPort: string,
  tcpPort: string,
) => {
  return {
    provide: proxyName,
    useFactory: (config: ConfigurationService) => {
      return ClientProxyFactory.create({
        transport: Transport.TCP,
        options: {
          port: Number(config.get(tcpPort)),
          host: config.get(hostPort),
        },
      });
    },
    inject: [ConfigurationService],
  };
};

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: 'driverLogs', schema: LogsSchema },
      { name: 'logEditRequestHistory', schema: LogEditRequestHistorySchema },
      { name: 'driverCsvData', schema: DriverCsvSchema },
      { name: 'UnidentifiedLogs', schema: UnidentifiedLogsSchema },
      { name: 'EditInsertLogs', schema: EditInsertLogsSchema },
      { name: 'EditInsertLogHistory', schema: EditInsertLogHistorySchema },
      { name: 'driverLiveLocation', schema: DriverLiveLocationSchema },
      {name:'RecordTable',schema:RecordTableSchema},
      { name: 'history', schema: HistorySchema },
    ]), // { name: 'driverCsvData', schema: DriverCsvSchema } { name: 'unidentifiedlog', schema: unidentifiedLogsSchema }
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigurationService) => {
        const useTunnel = JSON.parse(
          configService.get('USE_TUNNEL') ?? 'false',
        );

        const mongooseConfig = {
          uri: configService.mongoUri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };

        
        return mongooseConfig;
      },
      inject: [ConfigurationService],
    }), 
    // WebsocketModule,
  ],
  controllers: [
    AppController,
    LogsController,
    DriverCsvController,
    UnidentifiedLogsController
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MessagePatternResponseInterceptor,
    },WebsocketGateway,
    // LogsSocketGateway,WebsocketGateway,
    // SocketManagerService,
    /**
     * V2 UNIT_SERVICE Initialize
     * AUthor : Farzan
     */
    {
      provide: 'UNIT_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const unitServicePort = config.get('UNIT_MICROSERVICE_PORT');
        const unitServiceHost = config.get('UNIT_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(unitServicePort),
            host: unitServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'REPORT_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const reportServicePort = config.get('REPORT_MICROSERVICE_PORT');
        const reportServiceHost = config.get('REPORT_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(reportServicePort),
            host: reportServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    /**
     *
     */
    getProxyObject(
      'UNITS_SERVICE',
      'UNIT_MICROSERVICE_HOST',
      'UNIT_MICROSERVICE_PORT',
    ),
    getProxyObject(
      'VEHICLE_SERVICE',
      'VEHICLE_MICROSERVICE_HOST',
      'VEHICLE_MICROSERVICE_PORT',
    ),
    getProxyObject(
      'DRIVER_SERVICE',
      'DRIVER_MICROSERVICE_HOST',
      'DRIVER_MICROSERVICE_PORT',
    ),
    getProxyObject(
      'PUSH_NOTIFICATION_SERVICE',
      'PUSH_NOTIFICATION_MICROSERVICE_HOST',
      'PUSH_NOTIFICATION_MICROSERVICE_PORT',
    ),
    getProxyObject(
      'COMPANY_SERVICE',
      'COMPANY_MICROSERVICE_HOST',
      'COMPANY_MICROSERVICE_PORT',
    ),
    getProxyObject(
      'DEVICE_SERVICE',
      'DEVICE_MICROSERVICE_HOST',
      'DEVICE_MICROSERVICE_PORT',
    ),
     getProxyObject(
      'REPORT_SERVICE',
      'REPORT_MICROSERVICE_HOST',
      'REPORT_MICROSERVICE_PORT',
    ),
    { useClass: AppService, provide: 'AppService' },
    { useClass: LogsService, provide: 'LogsService' },
    { useClass: DriverCsvService, provide: 'DriverCsvService' },
    { useClass: UnidentifiedLogsService, provide: 'UnidentifiedLogsService' },
    ConfigurationService,
  ],
  // exports:[ 
  //   { useClass: DriverCsvService, provide: 'DriverCsvService' },

  // ]
})
export class AppModule {
  static port: number | string;
  static isDev: boolean;

  constructor(private readonly _configurationService: ConfigurationService) {
    AppModule.port = AppModule.normalizePort(
      _configurationService.get('SELF_MICROSERVICE_HOST'),
    );
    AppModule.isDev = _configurationService.isDevelopment;
  }
  /**
   * Normalize port or return an error if port is not valid
   * @param val The port to normalize
   */
  private static normalizePort(val: number | string): number | string {
    const port: number = typeof val === 'string' ? parseInt(val, 10) : val;

    if (Number.isNaN(port)) {
      return val;
    }

    if (port >= 0) {
      return port;
    }

    throw new Error(`Port "${val}" is invalid.`);
  }
}
