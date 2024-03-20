import {
  ForbiddenException,
  Put,
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
  ApiParam,
} from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { AppDeviceType, LogActionType } from 'logs/Enums';
import moment from 'moment';

export default function GetDriverCsvForAdminDecorators() {
  const liveApiUnit: Array<CombineDecoratorType> = [
    Put('csv/log'),
    SetMetadata('permissions', [HOS.GRAPH]),
    ApiParam({
      description: 'The vehicleId only for mobile when driver not logged in',
      name: 'vehicleId',
      example: 'ADBH456GYVYGV445J645',
      required: false,
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
  return CombineDecorators(liveApiUnit);
}
