import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiQuery, ApiOkResponse, getSchemaPath, refs, ApiExtraModels, ApiBody, ApiParam } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
import moment from 'moment';



export default function GetDriverCsvForAdminDecorators() {

  const GetDriverCsvDecorators: Array<CombineDecoratorType> = [
    Get('csv/log/'),
    SetMetadata('permissions', [HOS.HISTORY]),
    ApiQuery({
      description: 'The driverId only for backoffice',
      name: 'driverId',
      example: 'ADBH456GYVYGV445J645',
      required: false,
    }),
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
  return CombineDecorators(GetDriverCsvDecorators);
}
