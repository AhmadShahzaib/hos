import { ResponseModel } from '../models/response.model';
import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { sortableAttributes } from 'models';

export default function GetDriverRecords() {
  const GetDriverRecords: Array<CombineDecoratorType> = [
    Get("/driverRecords"),
    SetMetadata('permissions', [HOS.LOG_DUTY]),
    ApiBearerAuth('access-token'),
    ApiResponse({ status: HttpStatus.OK}),
    ApiQuery({
      name: 'search',
      example: 'search by email,firstName,lastName etc',
      required: false,
    }),
    ApiQuery({
      name: 'orderBy',
      example: 'Field by which record will be ordered',
      required: false,
      enum: sortableAttributes,
    }),
    ApiQuery({
      name: 'orderType',
      example: 'Ascending(1),Descending(-1)',
      enum: [1, -1],
      required: false,
    }),
    ApiQuery({
      name: 'pageNo',
      example: '1',
      description: 'The pageNo you want to get e.g 1,2,3 etc',
      required: false,
    }),
    ApiQuery({
        name: 'date',
        example: 'date',
        description: 'The pageNo you want to get e.g 1,2,3 etc',
        required: true,
      }),
  ];
  return CombineDecorators(GetDriverRecords);
}
