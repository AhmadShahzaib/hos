import {
  ConflictException,
  HttpStatus,
  Get,
  SetMetadata,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  GetOperationId,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function tripHistory() {
  const tripHistory: Array<CombineDecoratorType> = [
    Get('/tripHistory'),
    SetMetadata('permissions', ['90nfnafe']),
    ApiResponse({ status: HttpStatus.OK }),
    ApiParam({
      name: 'driverId',
      description: 'Driver id (system generated id) is required.',
      required: true,
    }),
    ApiQuery({
      description: 'The date you want to see history for.',
      name: 'date',
      example: 'Tue Jul 05 2022',
    }),
    ApiResponse({ status: HttpStatus.CONFLICT, type: ConflictException }),
    ApiOperation(GetOperationId('HOS', 'LastUnknownLocation')),
  ];
  return CombineDecorators(tripHistory);
}
