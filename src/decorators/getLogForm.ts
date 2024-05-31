import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import { ResponseModel } from '../models/response.model';

export default function GetLogformDecorators() {
  const getLogform: Array<CombineDecoratorType> = [
    Get('logform'),
    SetMetadata('permissions', [HOS.HISTORY]),
    ApiQuery({
      description: 'The driverId only for backoffice',
      name: 'driverId',
      example: 'ADBH456GYVYGV445J645',
      required: false,
    }),
    ApiQuery({
      description: 'The date you want to see Logform for.',
      name: 'date',
      example: '2024-05-21',
    }),

    ApiResponse({ status: HttpStatus.OK, type: [LogEntryRequestModel] })
  ];
  return CombineDecorators(getLogform);
}
