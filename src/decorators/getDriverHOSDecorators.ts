import {
  ForbiddenException,
  Get,
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
import moment from 'moment';

export default function GetDriverHOSDecorators() {
  const GetDriverHOSDecorators: Array<CombineDecoratorType> = [
    Get('csv/logdriver'),
    SetMetadata('permissions', [HOS.GRAPH]),
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
  return CombineDecorators(GetDriverHOSDecorators);
}
