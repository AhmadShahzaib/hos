import { ForbiddenException, HttpStatus, Put, SetMetadata } from '@nestjs/common';
import { ApiQuery, ApiOkResponse, getSchemaPath, refs, ApiExtraModels, ApiBody } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';

import moment from 'moment';



export default function unidentifiedDelete() {
 
  const unidentifiedDelete: Array<CombineDecoratorType> = [
    Put('/delete'),
    SetMetadata('permissions', ["30c7dbwq"]),
    ApiExtraModels(LogEntryRequestModel, Array<LogEntryRequestModel>),
    
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
  return CombineDecorators(unidentifiedDelete);
}
