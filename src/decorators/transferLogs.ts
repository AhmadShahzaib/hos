import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiQuery, ApiOkResponse, getSchemaPath, refs, ApiExtraModels, ApiBody } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';

import moment from 'moment';



export default function TransferLogs() {
 
  const TransferLogs: Array<CombineDecoratorType> = [
    Get('csv/transferLogs'),
    SetMetadata('permissions', [HOS.PROFILE]),
    ApiQuery({
      description: 'The driverId only for backoffice',
      name: 'driverId',
      example: 'ADBH456GYVYGV445J645',
      required: false,
    }),
    ApiQuery({
      name: 'date',
      description: 'Date from where log has to be transfered',
      example: '2022-09-25',
      required: true,
    }),
    ApiQuery({
      name: 'duration',
      example: '3253',
      description: 'Duration to transefer (Should be in sec)',
      required: true,
    }),ApiQuery({
      name: 'sequenceId',
      example: '3',
      description: 'Sequence Number of log',
      required: true,
    }), ApiQuery({
      name: 'type',
      example: '1',
      description: ' defines the type of trnasfer log',
      required: true,
    }),
    ApiBody({
      examples: {
        // "example 1": { value: example1 },
        // "example 2": { value: example2 },
        // "example 3": { value: example3 },
        // "example 4": { value: example4 },
        // "example 5": { value: example5 },

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
            // "example 1": { value: responseExample1 },
            // "example 2": { value: responseExample2 },
            // "example 3": { value: responseExample3 },
            // "example 4": { value: responseExample4 },
          },
        },
      },

    })

  ];
  return CombineDecorators(TransferLogs);
}
