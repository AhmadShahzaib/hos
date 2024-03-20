import {
  ForbiddenException,
  Get,
  HttpStatus,
  Post,
  SetMetadata,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import { ResponseModel } from '../models/response.model';

export default function GetMaintainedHistoryDecorator() {
  const getMaintainedHistoryDecorator: Array<CombineDecoratorType> = [
    // Get('getHistoryByParam/:id'),
    Get('history'),
    SetMetadata('permissions', [HOS.HISTORY]),
    ApiQuery({
      name: 'detail',
      description: 'detail (system generated id) is required.',
      required: true,
    }),
    ApiQuery({
      name: 'id',
      description: 'id (system generated id) is required.',
      required: true,
    }),

    ApiResponse({ status: HttpStatus.OK, type: [LogEntryRequestModel] }),
  ];
  return CombineDecorators(getMaintainedHistoryDecorator);
}
