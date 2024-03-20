import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function LogDutyDecorators() {
  const seOnDutyDecorators: Array<CombineDecoratorType> = [
    Post(':id'),
    SetMetadata('permissions', [HOS.LOG_DUTY]),
    ApiResponse({ status: HttpStatus.OK, type: Boolean })
  ];
  return CombineDecorators(seOnDutyDecorators);
}
