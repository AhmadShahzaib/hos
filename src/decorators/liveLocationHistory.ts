import {
  ForbiddenException,
  HttpStatus,
  Post,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiQuery,
  ApiOkResponse,
  getSchemaPath,
  refs,
  ApiExtraModels,
  ApiBody,
} from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';

import moment from 'moment';

export default function liveLocationHistory() {
  const liveLocationHistory: Array<CombineDecoratorType> = [
    Post('/liveLocationHistory'),
    SetMetadata('permissions', [HOS.ADD_LOG]),
    ApiExtraModels(LogEntryRequestModel, Array<LogEntryRequestModel>),
    ApiBody({
      examples: {
        // "example 1": { value: example1 },
        // "example 2": { value: example2 },
        // "example 3": { value: example3 },
        // "example 4": { value: example4 },
        // "example 5": { value: example5 },
      },
      schema: {
        // anyOf: [
        //   {
        //     type: 'array', items: { $ref: getSchemaPath(LogEntryRequestModel) },
        //   },
        //   {
        //     $ref: getSchemaPath(LogEntryRequestModel),
        //   }
        // ]
      },
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
    }),
  ];
  return CombineDecorators(liveLocationHistory);
}
