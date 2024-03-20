import { Post, Put, Query, SetMetadata } from '@nestjs/common';
import {
  ApiOkResponse,
  getSchemaPath,
  ApiExtraModels,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import { AppDeviceType, LogActionType } from 'logs/Enums';
import moment from 'moment';
import { EditLogEntryRequestModel } from 'models/editLogEntry.request.model';

export default function approveOrRejectEditRequestDecorator() {
  let example1: EditLogEntryRequestModel = {
    driverId: '635625dd471cc66e86df410f',
    tenantId: '6329cdf541c5047250e3d821',
    logs: [
      [
        {
          actionDate: moment().unix(),
          geoLocation: {
            latitude: 0.0,
            longitude: 0.0,
          },
          odoMeterMillage: 1.24,
          odoMeterSpeed: 0,
          engineHours: 1,
          engineRPMs: 0,
          actionType: LogActionType.OFF_DUTY,
          statusesData: {
            offDuty: {
              startedAt: 1666119600,
              lastStartedAt: 1666120800,
            },
          },
          id: '6356125f1c67b2ac0d9d72cb',
          deviceType: AppDeviceType.ANDROID,
          notes: 'notes',
        },
      ],
    ],
  };
  let example5 = [{ example1 }];
  let responseExample1 = {
    message: 'Log entry updated successfully',
    data: [
      {
        geoLocation: {
          longitude: 0,
          latitude: 0,
        },
        driverId: '62b305266cbdf2917b6ae389',
        tenantId: '62877e24970197c5d8e72a1e',
        serverDate: 1666585183,
        actionType: 'OFF_DUTY',
        isViolation: false,
        violations: [],
        actionDate: 1666119600,
        odoMeterMillage: 1.24,
        odoMeterSpeed: 0,
        engineHours: 1,
        engineRPMs: 0,
        statusesData: {
          offDuty: {
            startedAt: 1666119600,
            lastStartedAt: 1666123200,
          },
          violations: [],
          _id: '6356125f1c67b2ac0d9d72cc',
        },
        vehicleManualId: '80805',
        deviceType: 'android',
        _id: '6356125f1c67b2ac0d9d72cb',
        updated: [
          {
            geoLocation: {
              longitude: 0,
              latitude: 0,
            },
            actionType: 'OFF_DUTY',
            isViolation: false,
            violations: [],
            actionDate: 1666119600,
            odoMeterMillage: 1.24,
            odoMeterSpeed: 0,
            engineHours: 1,
            engineRPMs: 0,
            statusesData: {
              offDuty: {
                startedAt: 1666119600,
                lastStartedAt: 1666120800,
              },
              violations: [],
              _id: '6356131c1c67b2ac0d9d72d2',
            },
            deviceType: 'android',
            _id: '6356131c1c67b2ac0d9d72d1',
          },
          {
            geoLocation: {
              longitude: 0,
              latitude: 0,
            },
            actionType: 'DRIVING',
            isViolation: false,
            violations: [],
            actionDate: 1666120800,
            odoMeterMillage: 1.24,
            odoMeterSpeed: 0,
            engineHours: 1,
            engineRPMs: 0,
            statusesData: {
              onDriving: {
                startedAt: 1666120800,
                lastStartedAt: 1666122000,
              },
              violations: [],
              _id: '6356131c1c67b2ac0d9d72d4',
            },
            deviceType: 'android',
            _id: '6356131c1c67b2ac0d9d72d3',
          },
          {
            geoLocation: {
              longitude: 0,
              latitude: 0,
            },
            actionType: 'OFF_DUTY',
            isViolation: false,
            violations: [],
            actionDate: 1666122000,
            odoMeterMillage: 1.24,
            odoMeterSpeed: 0,
            engineHours: 1,
            engineRPMs: 0,
            statusesData: {
              offDuty: {
                startedAt: 1666122000,
                lastStartedAt: 1666121400,
              },
              violations: [],
              _id: '6356131c1c67b2ac0d9d72d6',
            },
            deviceType: 'android',
            _id: '6356131c1c67b2ac0d9d72d5',
          },
        ],
        createdAt: '2022-10-24T04:19:44.006Z',
        updatedAt: '2022-10-24T04:19:44.037Z',
        address: '',
        editRequest: [],
      },
    ],
  };

  const approveOrRejectEditRequestDecorator = [
    Post('isapproved'),
    SetMetadata('permissions', [HOS.EDIT_LOG]),
    ApiQuery({
      description: 'The driverId only for backoffice',
      name: 'driverId',
      example: 'ADBH456GYVYGV445J645',
      required: false,
    }),

    // ApiExtraModels(EditLogEntryRequestModel, Array<EditLogEntryRequestModel>),
    // ApiBody({
    //   examples: {
    //     'example 1': { value: example1 },
    //   },
    //   schema: {
    //     anyOf: [
    //       {
    //         type: 'array',
    //         items: { $ref: getSchemaPath(EditLogEntryRequestModel) },
    //       },
    //       {
    //         $ref: getSchemaPath(EditLogEntryRequestModel),
    //       },
    //     ],
    //   },
    // }),
    // ApiOkResponse({
    //   content: {
    //     'application/json': {
    //       examples: {
    //         "example 1": { value: responseExample1 },
    //       },
    //     },
    //   },

    // })
  ];
  return CombineDecorators(approveOrRejectEditRequestDecorator);
}