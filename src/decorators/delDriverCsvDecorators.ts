import { Delete, ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiQuery, ApiOkResponse, getSchemaPath, refs, ApiExtraModels, ApiBody } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
import moment from 'moment';



export default function DelDriverCsvDecorators() {
 
  const DelDriverCsvDecorators: Array<CombineDecoratorType> = [
    Delete('csv/log'),
    // SetMetadata('permissions', [HOS.GRAPH]),
    ApiQuery({
      name: 'start',
      description: 'start of the time',
      required: true,
    }),
    ApiQuery({
      name: 'end',
      description: 'end of the time',
      required: true,
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
  return CombineDecorators(DelDriverCsvDecorators);
}
