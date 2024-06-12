import { ForbiddenException, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiQuery, ApiOkResponse, getSchemaPath, refs, ApiExtraModels, ApiBody } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import moment from 'moment';



export default function AddLogEntryDecorators() {


 


  const responseExample1 = {
    "message": "Log Entry Added Successfully",
    "data": [
      {
        "driverId": "62ceb331f54a96ad2cb50502",
        "tenantId": "62a62afb14bcbd12f5afed03",
        "actionType": "ON_DUTY_NOT_DRIVING",
        "actionDate": "2022-07-16T06:30:00.000Z",
        "notes": "notes",
        "geoLocation": {
          "longitude": 0,
          "latitude": 0
        },
        "statusesData": {
          "onDuty": {
            "startedAt": "2022-07-16T06:10:00.000Z"
          },
          "_id": "62d3a7c08937811135c40e99"
        },
        "_id": "62d3a7c08937811135c40e98",
        "createdAt": "2022-07-17T06:10:08.993Z",
        "updatedAt": "2022-07-17T06:10:08.993Z"
      }
    ]
  }

  const responseExample2 = {
    "message": "Log Entry Added Successfully",
    "data": [
      {
        "driverId": "62ceb331f54a96ad2cb50502",
        "tenantId": "62a62afb14bcbd12f5afed03",
        "actionType": "ON_DUTY_NOT_DRIVING",
        "actionDate": "2022-07-16T06:30:00.000Z",
        "notes": "notes",
        "geoLocation": {
          "longitude": 0,
          "latitude": 0
        },
        "statusesData": {
          "onDuty": {
            "startedAt": "2022-07-16T06:10:00.000Z",
            "lastStartedAt": "2022-07-16T06:25:00.000Z"
          },
          "_id": "62d3a8138937811135c40e9f"
        },
        "_id": "62d3a8138937811135c40e9e",
        "createdAt": "2022-07-17T06:11:31.352Z",
        "updatedAt": "2022-07-17T06:11:31.352Z"
      }
    ]
  }

  const responseExample3 = {
    "message": "Log Entry Added Successfully",
    "data": [
      {
        "driverId": "62ceb331f54a96ad2cb50502",
        "tenantId": "62a62afb14bcbd12f5afed03",
        "actionType": "ON_DUTY_NOT_DRIVING",
        "actionDate": "2022-07-16T06:30:00.000Z",
        "notes": "notes",
        "geoLocation": {
          "longitude": 0,
          "latitude": 0
        },
        "statusesData": {
          "onDuty": {
            "startedAt": "2022-07-16T06:10:00.000Z",
            "lastStartedAt": "2022-07-16T06:25:00.000Z"
          },
          "_id": "62d3a83b8937811135c40ea5"
        },
        "_id": "62d3a83b8937811135c40ea4",
        "createdAt": "2022-07-17T06:12:11.368Z",
        "updatedAt": "2022-07-17T06:12:11.368Z"
      },
      {
        "driverId": "62ceb331f54a96ad2cb50502",
        "tenantId": "62a62afb14bcbd12f5afed03",
        "actionType": "DRIVING",
        "actionDate": "2022-07-16T06:20:00.000Z",
        "notes": "notes",
        "geoLocation": {
          "longitude": 0,
          "latitude": 0
        },
        "statusesData": {
          "onDriving": {
            "startedAt": "2022-07-16T06:20:00.000Z",
            "lastStartedAt": "2022-07-16T06:30:00.000Z"
          },
          "_id": "62d3a83b8937811135c40ea7"
        },
        "_id": "62d3a83b8937811135c40ea6",
        "createdAt": "2022-07-17T06:12:11.369Z",
        "updatedAt": "2022-07-17T06:12:11.369Z"
      }
    ]
  }

  const responseExample4 = {
    "message": "Log Entry Added Successfully",
    "data": [
      {
        "driverId": "62ceb331f54a96ad2cb50502",
        "tenantId": "62a62afb14bcbd12f5afed03",
        "actionType": "DRIVING",
        "actionDate": "2022-07-17T07:08:35.896Z",
        "notes": "notes",
        "geoLocation": {
          "longitude": 31.121546519849,
          "latitude": 31.5981861498498
        },
        "statusesData": {
          "onDriving": {
            "startedAt": "2022-07-17T07:08:35.896Z",
            "lastStartedAt": "2022-07-17T07:08:35.896Z"
          },
          "_id": "62d3b5b58a8cd6f4a6f87c1d"
        },
        "_id": "62d3b5b58a8cd6f4a6f87c1c",
        "createdAt": "2022-07-17T07:09:41.432Z",
        "updatedAt": "2022-07-17T07:09:41.432Z"
      }
    ]
  }

  const addLogEntryDecorators: Array<CombineDecoratorType> = [
    Post('log'),
    SetMetadata('permissions', [HOS.ADD_LOG]),
    ApiExtraModels(LogEntryRequestModel, Array<LogEntryRequestModel>),
    ApiBody({
      examples: {
       

      },
      schema: {
        anyOf: [
          {
            type: 'array', items: { $ref: getSchemaPath(LogEntryRequestModel) },
          },
          {
            $ref: getSchemaPath(LogEntryRequestModel),
          }
        ]
      }

    }),
    ApiOkResponse({
      content: {
        'application/json': {
          examples: {
            "example 1": { value: responseExample1 },
            "example 2": { value: responseExample2 },
            "example 3": { value: responseExample3 },
            "example 4": { value: responseExample4 },
          },
        },
      },

    })

  ];
  return CombineDecorators(addLogEntryDecorators);
}
