import { ForbiddenException, HttpStatus, Get, SetMetadata } from '@nestjs/common';
import { ApiQuery,ApiParam, ApiOkResponse, getSchemaPath, refs, ApiExtraModels, ApiBody } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';

import moment from 'moment';



export default function unidentifiedGetById() {
 
  const unidentifiedGetById: Array<CombineDecoratorType> = [
    Get('/:id'),
    SetMetadata('permissions', ["30q7dblas"]),
    ApiExtraModels(LogEntryRequestModel, Array<LogEntryRequestModel>),
   
    ApiParam({
      name: 'id',
      description: 'Driver id (system generated id) is required.',
      required: true,
    }),
    ApiQuery({
      description: 'The date you want to see history for.',
      name: 'date',
      example: 'Tue Jul 05 2022',
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
  return CombineDecorators(unidentifiedGetById);
}
