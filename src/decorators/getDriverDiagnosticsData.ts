import { ResponseModel } from '../models/response.model';
import {
  ForbiddenException,
  Get,
  HttpStatus,
  Post,
  SetMetadata,
} from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function GetDriverDiagnosticsDataDecorators() {
  const response1 = {
    statusCode: 404,
    message: 'No Data found for this driver',
    error: 'Not Found',
  };

  const getDriverDiagnosticsDataDecorators: Array<CombineDecoratorType> = [
    Get('diagnostic/:id'),
    SetMetadata('permissions', ['91b5bafes']),
    ApiParam({
      name: 'id',
      description: 'Driver id (system generated id) is required.',
      example: '',
      required: true,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      content: {
        'application/json': {
          examples: {
          
          },
        },
      },
    }),
  ];
  return CombineDecorators(getDriverDiagnosticsDataDecorators);
}
