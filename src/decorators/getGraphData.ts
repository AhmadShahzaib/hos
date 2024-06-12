import { Get, HttpStatus, SetMetadata } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { GraphDataResponseModel } from '../models/graphData.response.model';

export default function GetGraphDataDecorators() {
  const example1 = {
    request: {},
    response: {
      message: 'Success',
      "data": [
        {
          "status": "offDuty",
          "startedAt": 1666065600,
          "lastStartedAt": 1666069200,
          "totalSecondsSpentSoFar": 3600,
          "actionDate": 1666065600,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "vehicleManualId": "80805",
          "address": "",
          "driver": {
            "id": "62b305266cbdf2917b6ae389",
            "tenantId": "62877e24970197c5d8e72a1e",
            "firstName": "Ben",
            "lastName": "Tucker"
          },
          "id": "634e57a7e222ccad09270997",
          "violations": [],
          "deviceType": "android"
        },
        {
          "status": "onDuty",
          "startedAt": 1666071000,
          "lastStartedAt": 1666071300,
          "totalSecondsSpentSoFar": 300,
          "actionDate": 1666071000,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "vehicleManualId": "80805",
          "address": "",
          "driver": {
            "id": "62b305266cbdf2917b6ae389",
            "tenantId": "62877e24970197c5d8e72a1e",
            "firstName": "Ben",
            "lastName": "Tucker"
          },
          "id": "634e584de222ccad092709ae",
          "violations": [],
          "deviceType": "android",
          "updated": {
            "status": "onDuty",
            "startedAt": 1666071000,
            "lastStartedAt": 1666071300,
            "totalSecondsSpentSoFar": 300,
            "actionDate": 1666065600,
            "odoMeterMillage": 1.24,
            "odoMeterSpeed": 0,
            "engineHours": 1,
            "violations": [],
            "deviceType": "android",
            "parentId": "634e584de222ccad092709ae"
          }
        },
        {
          "status": "offDuty",
          "startedAt": 1666071600,
          "lastStartedAt": 1666071900,
          "totalSecondsSpentSoFar": 300,
          "actionDate": 1666070400,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "vehicleManualId": "80805",
          "address": "",
          "driver": {
            "id": "62b305266cbdf2917b6ae389",
            "tenantId": "62877e24970197c5d8e72a1e",
            "firstName": "Ben",
            "lastName": "Tucker"
          },
          "id": "634e5ae1e222ccad09270a24",
          "violations": [],
          "deviceType": "android",
          "updated": {
            "status": "offDuty",
            "startedAt": 1666071300,
            "totalSecondsSpentSoFar": null,
            "actionDate": 1666065600,
            "odoMeterMillage": 1.24,
            "odoMeterSpeed": 0,
            "engineHours": 1,
            "violations": [],
            "deviceType": "android",
            "parentId": "634e5ae1e222ccad09270a24"
          }
        },
        {
          "geoLocation": {
            "longitude": 0,
            "latitude": 0
          },
          "driverId": "62b305266cbdf2917b6ae389",
          "tenantId": "62877e24970197c5d8e72a1e",
          "serverDate": 1666087696,
          "actionType": "OFF_DUTY",
          "isViolation": false,
          "violations": [],
          "actionDate": 1666070400,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "engineRPMs": 0,
          "statusesData": {
            "offDuty": {
              "startedAt": 1666071300
            },
            "violations": []
          },
          "vehicleManualId": "80805",
          "deviceType": "android",
          "_id": "634e7b10f7ebd50e5ac32816",
          "createdAt": "2022-10-18T10:08:16.676Z",
          "updatedAt": "2022-10-18T10:08:16.751Z",
          "address": "",
          "status": "offDuty",
          "startedAt": 1666071300,
          "lastStartedAt": 1666160263,
          "totalSecondsSpentSoFar": 88963
        }
      ]
    },
  };
  const GetGraphDataDecorators: Array<CombineDecoratorType> = [
    Get('graph/:driverId'),
    SetMetadata('permissions', [HOS.GRAPH]),
    ApiExtraModels(GraphDataResponseModel),
    ApiParam({
      name: 'driverId',
      allowEmptyValue: false,
    }),
    ApiQuery({
      name: 'date',
      required: false,
    }),
    ApiOkResponse({
      content: {
        'application/json': {
          schema: {
            type: 'array', items: { $ref: getSchemaPath(GraphDataResponseModel) },
          },
          examples: {
            'example 1': { value: example1.response },
          },
        },
      },
    }),
  ];
  return CombineDecorators(GetGraphDataDecorators);
}
export function GetDriverGraphDataDecorators() {
  const example2 = {
    request: {},
    response: {
      message: 'Success',
      "data": [
        {
          "status": "offDuty",
          "startedAt": 1666065600,
          "lastStartedAt": 1666069200,
          "totalSecondsSpentSoFar": 3600,
          "actionDate": 1666065600,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "vehicleManualId": "80805",
          "address": "",
          "driver": {
            "id": "62b305266cbdf2917b6ae389",
            "tenantId": "62877e24970197c5d8e72a1e",
            "firstName": "Ben",
            "lastName": "Tucker"
          },
          "id": "634e57a7e222ccad09270997",
          "violations": [],
          "deviceType": "android"
        },
        {
          "status": "onDuty",
          "startedAt": 1666071000,
          "lastStartedAt": 1666071300,
          "totalSecondsSpentSoFar": 300,
          "actionDate": 1666071000,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "vehicleManualId": "80805",
          "address": "",
          "driver": {
            "id": "62b305266cbdf2917b6ae389",
            "tenantId": "62877e24970197c5d8e72a1e",
            "firstName": "Ben",
            "lastName": "Tucker"
          },
          "id": "634e584de222ccad092709ae",
          "violations": [],
          "deviceType": "android",
          "updated": {
            "status": "onDuty",
            "startedAt": 1666071000,
            "lastStartedAt": 1666071300,
            "totalSecondsSpentSoFar": 300,
            "actionDate": 1666065600,
            "odoMeterMillage": 1.24,
            "odoMeterSpeed": 0,
            "engineHours": 1,
            "violations": [],
            "deviceType": "android",
            "parentId": "634e584de222ccad092709ae",
            "driver": {
              "id": "62b305266cbdf2917b6ae389",
              "tenantId": "62877e24970197c5d8e72a1e",
              "firstName": "Ben",
              "lastName": "Tucker"
            },
          }
        },
        {
          "status": "offDuty",
          "startedAt": 1666071600,
          "lastStartedAt": 1666071900,
          "totalSecondsSpentSoFar": 300,
          "actionDate": 1666070400,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "vehicleManualId": "80805",
          "address": "",
          "driver": {
            "id": "62b305266cbdf2917b6ae389",
            "tenantId": "62877e24970197c5d8e72a1e",
            "firstName": "Ben",
            "lastName": "Tucker"
          },
          "id": "634e5ae1e222ccad09270a24",
          "violations": [],
          "deviceType": "android",
          "updated": {
            "status": "offDuty",
            "startedAt": 1666071300,
            "totalSecondsSpentSoFar": null,
            "actionDate": 1666065600,
            "odoMeterMillage": 1.24,
            "odoMeterSpeed": 0,
            "engineHours": 1,
            "violations": [],
            "deviceType": "android",
            "parentId": "634e5ae1e222ccad09270a24",
            "driver": {
              "id": "62b305266cbdf2917b6ae389",
              "tenantId": "62877e24970197c5d8e72a1e",
              "firstName": "Ben",
              "lastName": "Tucker"
            },
          }
        },
        {
          "geoLocation": {
            "longitude": 0,
            "latitude": 0
          },
          "driverId": "62b305266cbdf2917b6ae389",
          "tenantId": "62877e24970197c5d8e72a1e",
          "serverDate": 1666087696,
          "actionType": "OFF_DUTY",
          "isViolation": false,
          "violations": [],
          "actionDate": 1666070400,
          "odoMeterMillage": 1.24,
          "odoMeterSpeed": 0,
          "engineHours": 1,
          "engineRPMs": 0,
          "statusesData": {
            "offDuty": {
              "startedAt": 1666071300
            },
            "violations": []
          },
          "vehicleManualId": "80805",
          "deviceType": "android",
          "_id": "634e7b10f7ebd50e5ac32816",
          "createdAt": "2022-10-18T10:08:16.676Z",
          "updatedAt": "2022-10-18T10:08:16.751Z",
          "address": "",
          "status": "offDuty",
          "startedAt": 1666071300,
          "lastStartedAt": 1666160263,
          "totalSecondsSpentSoFar": 88963
        }
      ]
    },
  };
  const GetDriverGraphDataDecorators: Array<CombineDecoratorType> = [
    Get('graph'),
    SetMetadata('permissions', [HOS.GRAPH]),
    ApiExtraModels(GraphDataResponseModel),
    ApiQuery({
      name: 'date',
      required: false,
    }),
    ApiOkResponse({
      status: HttpStatus.OK,
      content: {
        'application/json': {
          schema: {
            type: 'array', items: { $ref: getSchemaPath(GraphDataResponseModel) },
          },
          examples: {
            'example 1': { value: example2.response },
          },
        },
      },
    }),
  ];
  return CombineDecorators(GetDriverGraphDataDecorators);
}
