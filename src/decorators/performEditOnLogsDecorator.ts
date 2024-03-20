performEditOnLogsDecorator;

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

export default function performEditOnLogsDecorator() {
  const performEditOnLogsDecorator: Array<CombineDecoratorType> = [
    Post('/perform/edit'),
    SetMetadata('permissions', [HOS.EDIT_LOG]),
    ApiQuery({
      name: 'driverId',
      description: 'Driver id (system generated id) is required.',
      required: true,
    }),
    ApiQuery({
      name: 'date',
      description: 'Date is required.',
      required: true,
    }),
    // ApiResponse({ status: HttpStatus.OK, type: Boolean }),
  ];
  return CombineDecorators(performEditOnLogsDecorator);
}
