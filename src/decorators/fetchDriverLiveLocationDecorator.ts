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

export default function FetchDriverLiveLocation() {
  const fetchDriverLiveLocationDecorator: Array<CombineDecoratorType> = [
    Get('/liveLocationHistory'),
    SetMetadata('permissions', [HOS.MY_LIVE]),
    ApiQuery({
      name: 'driverId',
      description: 'Driver id (system generated id) is required.',
      required: true,
    }),
    ApiResponse({ status: HttpStatus.OK, type: [LogEntryRequestModel] }),
  ];
  return CombineDecorators(fetchDriverLiveLocationDecorator);
}
