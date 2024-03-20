import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import { ResponseModel } from '../models/response.model';

export default function GetDriverHistoryByParamDecorators() {
  const getDriverHistoryDecorators: Array<CombineDecoratorType> = [
    Get('getHistoryByParam/:id'),
    SetMetadata('permissions', [HOS.HISTORY_BY_PARAM]),
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
    ApiQuery({
        name: 'orderBy',
        example: 'Field by which record will be ordered',
        enum:['actionDate'],
        required: false,
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
        name: 'limit',
        example: '10',
        description: 'The number of records you want on one page.',
        required: false,
    }),
    ApiResponse({ status: HttpStatus.OK, type: [LogEntryRequestModel] })
  ];
  return CombineDecorators(getDriverHistoryDecorators);
}
