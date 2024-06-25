import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Inject,
  Res,
  Query,
  ValidationPipe,
  Req,
  Logger,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { CreateUnidentifiedLogsDto } from 'dto/createUnidentifiedLogs.dto';
import { PaginationDto } from 'dto/pagination.dto';
import { UpdateUnidentifiedLogsDto } from 'dto/updateUnidentifiedLogs.dto';
import { UnidentifiedLogsService } from '../services/unidentifiedLogs.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import unidentifiedCancel from '../decorators/unidentifiedCancel';
import unidentifiedRespond from '../decorators/unidentifiedRespond';
import unidentifiedAdd from '../decorators/unidentifiedAdd';
import unidentifiedGet from '../decorators/unidentifiedGet';
import unidentifiedGetById from '../decorators/unidentifiedGetById';
import unidentifiedEdit from '../decorators/unidentifiedEdit';
import unidentifiedDelete from '../decorators/unidentifiedDelete';
unidentifiedEdit;
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ClientProxy } from '@nestjs/microservices';
import {
  mapMessagePatternResponseToException,
  MessagePatternResponseType,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { firstValueFrom } from 'rxjs';
import moment from 'moment';
import jwt_decode from 'jwt-decode';
import UnidentifiedLogsDocument from 'mongoDb/document/unidentifiedLog.document';

@Controller('HOS/unidentifiedLogs')
export class UnidentifiedLogsController {
  constructor(
    @Inject('UnidentifiedLogsService')
    private readonly unidetifiedLogsService: UnidentifiedLogsService,
    @Inject('PUSH_NOTIFICATION_SERVICE')
    private readonly pushNotificationClient: ClientProxy,
    @Inject('UNIT_SERVICE')
    private readonly unitClient: ClientProxy,
    @Inject('DRIVER_SERVICE') private readonly driverClient: ClientProxy,
    private readonly gateway: WebsocketGateway,
    @Inject('VEHICLE_SERVICE') private readonly vehicleClient: ClientProxy,
    @Inject('DEVICE_SERVICE') private readonly deviceClient: ClientProxy,
  ) {}

  @unidentifiedRespond()
  async respondUnidentified(@Body() reqBody, @Req() req, @Res() res) {
    try {
      const {
        eventSequenceIdNumber,
        eldNumber,
        isAccepted,
        reason,
        origin,
        destination,
      } = reqBody;

      let extractedUserFromToken;
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const user = jwt_decode<JwtPayload>(token);
        extractedUserFromToken = JSON.parse(user?.sub);
      } else {
        return res.status(401).send({
          statusCode: 401,
          message: 'Authentication token is required!',
          dtaa: {},
        });
      }
      const routeAccess = extractedUserFromToken?.isDriver;

      if (routeAccess) {
        if (isAccepted == 1 || isAccepted == 0) {
        } else {
          return res.status(422).send({
            statusCode: 422,
            message: 'Valid values to respond are either 0 or 1!',
            data: {},
          });
        }

        const driverId = extractedUserFromToken.id;
        const object = {
          eventSequenceIdNumber,
          eldNumber,
          isAccepted,
          driverId,
          reason,
          origin,
          destination,
        };

        const response = await this.unidetifiedLogsService.respond(object);
        return res.status(response.statusCode).send(response);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel assignment of unidentified log from BO - V2
   * Author Farzan
   */
  @unidentifiedCancel()
  async cancelUnidentified(@Query() query, @Req() req, @Res() res) {
    try {
      const unidentifiedLogId = query.id;
      let user;
      let extractedUserFromToken;
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        user = jwt_decode<JwtPayload>(token);
        extractedUserFromToken = JSON.parse(user?.sub);
      } else {
        return res.status(401).send({
          statusCode: 401,
          message: 'Authentication token is required!',
          dtaa: {},
        });
      }
      const routeAccess = extractedUserFromToken?.isDriver;

      if (!routeAccess) {
        const object = {
          unidentifiedLogId,
        };

        const response = await this.unidetifiedLogsService.cancel(object);
        if (response?.currentDriver) {
          const messagePatternDriver =
            await firstValueFrom<MessagePatternResponseType>(
              this.driverClient.send(
                { cmd: 'get_driver_by_id' },
                response?.currentDriver,
              ),
            );
          if (messagePatternDriver?.isError) {
            mapMessagePatternResponseToException(messagePatternDriver);
          }
          const driver = messagePatternDriver?.data;

          const notificationObj = {
            logs: [response.data],
            editRequest: [],
            dateTime: '',
            driverId: driver?._id,
            notificationType: 2,
            editStatusFromBO: 'unassign',
          };
          const SpecificClient = driver?.client;

          const mesaage = 'Driver assigned!';

          // let WebsocketGateway: WebsocketGateway;

          this.gateway.notifyDriver(
            SpecificClient,
            'notifyDriver',
            mesaage,
            notificationObj,
          );
        }

        return res.status(response.statusCode).send(response);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * create unidentified logs - V2
   * Author Farzan
   */
  @unidentifiedAdd()
  /**
   * CreateUnidentifiedLogsDto : File for validating req body
   */
  async create(
    @Body(
      new ValidationPipe({
        whitelist: true,
      }),
    )
    reqBody: CreateUnidentifiedLogsDto,
    @Res() res,
  ) {
    try {
      const logs = reqBody.unidentifiedLogs;
      let response;

      /**
       * Against log fetch vehicle name by vinNo - Check vehicle if valid before insertion of log in DB
       */
      for (let i = 0; i < reqBody.unidentifiedLogs.length; i++) {
        const messagePatternVehicle =
          await firstValueFrom<MessagePatternResponseType>(
            this.vehicleClient.send(
              { cmd: 'get_vehicle_by_vin' },
              reqBody.unidentifiedLogs[i].cmvVinNo,
            ),
          );
        if (messagePatternVehicle.isError) {
          mapMessagePatternResponseToException(messagePatternVehicle);
        }
      }

      response = await this.unidetifiedLogsService.create(logs);
      return res.status(response.statusCode).send(response);
      // return res.send(reqBody);
      // const { cmvVin } = reqBody;
      // let deviceTokens;

      // if (cmvVin) {
      //   deviceTokens = await firstValueFrom(
      //     this.unitClient.send({ cmd: 'get_units' }, cmvVin),
      //   );
      //   if (deviceTokens.isError) {
      //     Logger.log(`Coneection to units failed!`);
      //     throw new NotFoundException(`Coneection to units failed!`);
      //   }
      // }

      // /**
      //  * Extract all device tokens from the response
      //  */

      // const devices = deviceTokens.data;

      // let messagePatternPushNotification;
      // if (devices && devices.length > 0) {
      //   this.pushNotificationClient.connect();
      //   for (let i = 0; i < devices.length; i++) {
      //     messagePatternPushNotification =
      //       await firstValueFrom<MessagePatternResponseType>(
      //         this.pushNotificationClient.send(
      //           { cmd: 'send_notification' },
      //           {
      //             deviceToken: devices[i],
      //             data: { title: 'Log Unidentified Miles Request', ...reqBody },
      //           },
      //         ),
      //       );

      //     if (messagePatternPushNotification.isError) {
      //       Logger.log(`Error while sending notification`);
      //       mapMessagePatternResponseToException(
      //         messagePatternPushNotification,
      //       );
      //     }
      //   }
      // }
    } catch (error) {
      return res.status(400).send({
        message: error.message,
        data: {},
      });
    }
  }

  /**
   * Fetch unidentified logs - V2
   * Author Farzan
   * @description Fetch all unidentified logs, filters applied.
   * @param query includes pageNo, limit, startDate, endDate, vinNo
   * @param res
   * @returns
   */
  @unidentifiedGet()
  async findAll(
    @Query(
      /**
       * To strip of any irrelevent field
       */
      new ValidationPipe({
        whitelist: true,
      }),
    )
    query: PaginationDto,
    @Res() res,
    @Req() req,
  ) {
    try {
      let options = {};
      const { startDate, endDate, vinNo, type } = query;
      const { tenantId: id } = req.user ?? ({ tenantId: undefined } as any);

      let extractedUserFromToken;
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const user = jwt_decode<JwtPayload>(token);
        extractedUserFromToken = JSON.parse(user?.sub);
      } else {
        return res.status(401).send({
          statusCode: 401,
          message: 'Authentication token is required!',
          dtaa: {},
        });
      }
      const routeAccess = extractedUserFromToken?.isDriver;

      if (!routeAccess) {
        if (startDate && endDate) {
          const start = moment(`${startDate}`).format('MMDDYY');
          const end = moment(`${endDate}`).format('MMDDYY');
          options = {
            eventDate: {
              $gte: start,
              $lte: end,
            },
          };
        }
        if (vinNo) {
          options = {
            ...options,
            cmvVinNo: {
              $eq: vinNo,
            },
          };
        }
        if (type) {
          options = {
            ...options,
            type: {
              $eq: type,
            },
          };
        }
        options = {
          ...options,
          // because tenantId is not available yet
          tenantId: {
            $eq: extractedUserFromToken.tenantId,
          },
        };
        // query.tenantId=extractedUserFromToken.tenantId
        const response = await this.unidetifiedLogsService.findAll(
          query,
          options,
        );

        for (let i = 0; i < response.data.length; i++) {
          if (response.data[i].driverId != 'unidentified') {
            const driverId = response.data[i].driverId;
            const messagePatternUnits =
              await firstValueFrom<MessagePatternResponseType>(
                this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
              );
            if (messagePatternUnits.isError) {
              // mapMessagePatternResponseToException(messagePatternUnits);
              response.data[i].driverFullName = '';
            }
            response.data[i].driverFullName =
              messagePatternUnits?.data?.fullName;
          } else {
            response.data[i].driverFullName = '';
          }

          const vinNo = response.data[i].cmvVinNo;
          const messagePatternUnits =
            await firstValueFrom<MessagePatternResponseType>(
              this.vehicleClient.send({ cmd: 'get_vehicle_by_vin' }, vinNo),
            );
          if (messagePatternUnits.isError) {
            // mapMessagePatternResponseToException(messagePatternUnits);
            response.data[i].vehicleId = '';
          } else {
            response.data[i].vehicleId = messagePatternUnits?.data?.vehicleId;
          }
        }

        return res.status(response?.statusCode).send(response);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (err) {
      return res.status(400).send({
        message: err.message,
        data: [],
      });
    }
  }
  @Get('/vin')
  async findAllVin(
    @Query()
    query: /**
     * To strip of any irrelevent field
     */
    PaginationDto,
    @Res() res,
    @Req() req,
  ) {
    try {
      let options = {};
      const { vinNo } = query;

      let extractedUserFromToken;
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const user = jwt_decode<JwtPayload>(token);
        extractedUserFromToken = JSON.parse(user?.sub);
      } else {
        return res.status(401).send({
          statusCode: 401,
          message: 'Authentication token is required!',
          dtaa: {},
        });
      }
      const routeAccess = extractedUserFromToken?.isDriver;

      if (routeAccess) {
        if (vinNo) {
          options = {
            ...options,
            cmvVinNo: {
              $eq: vinNo,
            },
          };
        }

        const response = await this.unidetifiedLogsService.findAllVin(
          query,
          options,
        );

        for (let i = 0; i < response.data.length; i++) {
          if (response.data[i].driverId != 'unidentified') {
            const driverId = response.data[i].driverId;
            const messagePatternUnits =
              await firstValueFrom<MessagePatternResponseType>(
                this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
              );
            if (messagePatternUnits.isError) {
              // mapMessagePatternResponseToException(messagePatternUnits);
              response.data[i].driverFullName = '';
            }
            response.data[i].driverFullName =
              messagePatternUnits?.data?.fullName;
          } else {
            response.data[i].driverFullName = '';
          }

          const vinNo = response.data[i].cmvVinNo;
          const messagePatternUnits =
            await firstValueFrom<MessagePatternResponseType>(
              this.vehicleClient.send({ cmd: 'get_vehicle_by_vin' }, vinNo),
            );
          if (messagePatternUnits.isError) {
            // mapMessagePatternResponseToException(messagePatternUnits);
            response.data[i].vehicleId = '';
          } else {
            response.data[i].vehicleId = messagePatternUnits?.data?.vehicleId;
          }
        }

        return res.status(response?.statusCode).send(response);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (err) {
      return res.status(400).send({
        message: err.message,
        data: [],
      });
    }
  }

  /**
   * Assing unidentified logs  - V2
   * Description:
   *            Currently the api is designed to assign unidentified log to driver by admin
   * Author : Farzan
   */
  @unidentifiedEdit()
  async assignUnidentified(
    @Body() data,
    @Query() queryParams,
    @Res() res,
    @Req() req,
  ) {
    try {
      const { driverId } = queryParams;
      const {
        unidentifiedLogId,
        statusCode,
        eventCode,eventType,
        reason,
        originAddress,
        destinationAddress,
      } = data;
      if (!driverId) {
        return res.status(421).send({
          statusCode: 421,
          message: 'driverId is required',
          data: {},
        });
      }
      const messagePatternDriver =
        await firstValueFrom<MessagePatternResponseType>(
          this.driverClient.send({ cmd: 'get_driver_by_id' }, data?.driverId),
        );
      if (messagePatternDriver?.isError) {
        mapMessagePatternResponseToException(messagePatternDriver);
      }
      const user = messagePatternDriver?.data;
      let extractedUserFromToken;
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const user = jwt_decode<JwtPayload>(token);
        extractedUserFromToken = JSON.parse(user?.sub);
      } else {
        return res.status(401).send({
          statusCode: 401,
          message: 'Authentication token is required!',
          dtaa: {},
        });
      }
      const routeAccess = extractedUserFromToken?.isDriver;

      if (!routeAccess) {
        const object = {
          driverId,
          statusCode,
          eventCode,eventType,
          reason,
          originAddress,
          destinationAddress,
        };

        const response: any = await this.unidetifiedLogsService.updateById(
          unidentifiedLogId,
          object,
        );

        if (response.statusCode == 200) {
          const currentYear = new Date().getFullYear();
          const dateStr = response?.data?.eventDate;
          const timeStr = response?.data?.eventTime;
          const dateTimeStr = `${currentYear}${dateStr} ${timeStr}`;

          const unixDateTime = moment(dateTimeStr, 'YYYYMMDD HHmmss').unix();

          //"notifcationType:1 = editLog|| 2= unidentifiedLog || 3 = insertLog"
          const notificationObj = {
            logs: [response.data],
            editRequest: [],
            dateTime: unixDateTime,
            driverId: object.driverId,
            notificationType: 2,
            editStatusFromBO: 'assign',
          };
          const SpecificClient = user?.client;

          const mesaage = 'Driver assigned!';

          // let WebsocketGateway: WebsocketGateway;

          this.gateway.notifyDriver(
            SpecificClient,
            'notifyDriver',
            mesaage,
            notificationObj,
          );

          return res.status(response.statusCode).send(response);
        }
        return res.status(response.statusCode).send(response);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }
  /**
   * Delete unidentified logs  - V2
   * Description:
   *            Currently the api is designed to Delete unidentified log
   * Author :  NOT Farzan
   */
  @unidentifiedDelete()
  async deleteUnidentified(@Body() data, @Res() res, @Req() req) {
    try {
      const { unidentifiedLogIds } = data;
      const response: any = await this.unidetifiedLogsService.deleteMany(
        unidentifiedLogIds,
      );

      if (response.statusCode == 200) {
        return res.status(response.statusCode).send(response);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }
  /**
   * Accumulated hours - V2
   * Description:
   *            fetch hours of unidentified-unassigned, unidentified-assigned and unidentified-accepted
   * Author : Farzan
   */
  @Get('/accumulatedhours')
  async fetchConsumedHours(@Res() res, @Req() req) {
    try {
      let extractedUserFromToken;
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const user = jwt_decode<JwtPayload>(token);
        extractedUserFromToken = JSON.parse(user?.sub);
      } else {
        return res.status(401).send({
          statusCode: 401,
          message: 'Authentication token is required!',
          dtaa: {},
        });
      }
      const routeAccess = extractedUserFromToken?.isDriver;

      if (!routeAccess) {
        const response =
          await this.unidetifiedLogsService.fetchUnidentifiedConsumedTime();

        return res.status(response.statusCode).send(response);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch log by Id - V2
   * Description :
   *
   * Author Farzan
   */
  @unidentifiedGetById()
  async findById(@Param() params, @Res() res, @Req() req) {
    try {
      const { id } = params;
      let customResponse;

      let extractedUserFromToken;
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const user = jwt_decode<JwtPayload>(token);
        extractedUserFromToken = JSON.parse(user?.sub);
      } else {
        return res.status(401).send({
          statusCode: 401,
          message: 'Authentication token is required!',
          dtaa: {},
        });
      }
      const routeAccess = extractedUserFromToken?.isDriver;

      if (!routeAccess) {
        const response: any = await this.unidetifiedLogsService.findById(id);

        /**
         * Against log fetch driver name by driverId
         */
        let driverFullName;
        if (response.data.driverId != 'unidentified') {
          const messagePatternDriver =
            await firstValueFrom<MessagePatternResponseType>(
              this.driverClient.send(
                { cmd: 'get_driver_by_id' },
                response.data.driverId,
              ),
            );
          if (messagePatternDriver.isError) {
            mapMessagePatternResponseToException(messagePatternDriver);
          }
          driverFullName = messagePatternDriver?.data?.fullName;
        }

        /**
         * Against log fetch vehicle name by vinNo
         */
        const messagePatternVehicle =
          await firstValueFrom<MessagePatternResponseType>(
            this.vehicleClient.send(
              { cmd: 'get_vehicle_by_vin' },
              response.data.cmvVinNo,
            ),
          );
        if (messagePatternVehicle.isError) {
          mapMessagePatternResponseToException(messagePatternVehicle);
        }
        const vehicleId = messagePatternVehicle?.data?.vehicleId;

        customResponse = {
          ...response,
          data: {
            ...response.data._doc,
            driverFullName: driverFullName,
            vehicleId: vehicleId,
          },
        };

        return res.status(customResponse.statusCode).send(customResponse);
      } else {
        return res.status(403).send({
          statusCode: 403,
          message: 'Not permissible to access the route!',
          data: [],
        });
      }
    } catch (err) {
      return res.status(400).send({
        message: err.message,
        data: {},
      });
    }
  }

  // @Get('/:vinNo')
  // async unidentifiedAgainstVin(
  //   @Query(
  //     /**
  //      * To strip of any irrelevent field
  //      */
  //     new ValidationPipe({
  //       whitelist: true,
  //     }),
  //   )
  //   query: PaginationDto,
  //   @Res() res,
  //   @Req() req,
  // ) {
  //   try {
  //     const { vinNo } = req.params;
  //     const response = await this.unidetifiedLogsService.fetchLogsAgainstVim(
  //       vinNo,
  //       query,
  //     );
  //     return res.status(response?.statusCode).send(response);
  //   } catch (error) {
  //     return res.status(400).send({
  //       message: error.message,
  //       data: {},
  //     });
  //   }
  // }

  // @Put('/:id')
  // /**
  //  * UpdateUnidentifiedLogsDto : File for validating req body
  //  */
  // async updateById(
  //   @Param() params,
  //   @Body(
  //     new ValidationPipe({
  //       whitelist: true,
  //     }),
  //   )
  //   body: UpdateUnidentifiedLogsDto,
  //   @Res() res,
  // ) {
  //   try {
  //     const { id } = params;
  //     const response = await this.unidetifiedLogsService.updateById(id, body);
  //     return response.statusCode == 200
  //       ? res.status(response.statusCode).send(response)
  //       : res.status(response.statusCode).send(response);
  //   } catch (err) {
  //     return res.status(400).send({
  //       message: err.message,
  //       data: {},
  //     });
  //   }
  // }

  // @Delete('/:id')
  // async deleteById(@Param() params, @Res() res) {
  //   try {
  //     const { id } = params;
  //     const response = await this.unidetifiedLogsService.deleteById(id);
  //     return response.statusCode == 200
  //       ? res.status(response.statusCode).send(response)
  //       : res.status(response.statusCode).send(response);
  //   } catch (err) {
  //     return res.status(400).send({
  //       message: err.message,
  //       data: {},
  //     });
  //   }
  // }
}
