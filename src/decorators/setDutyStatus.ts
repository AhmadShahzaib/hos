import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function SetDutyStatusDecorators() {
  const setDutyStatusDecorators: Array<CombineDecoratorType> = [
    Post('status/:id'),
    SetMetadata('permissions', [HOS.DUTY_STATUS]),
    ApiParam({
      name: 'id',
      description: 'Driver id (system generated id) is required.',
      required: true,
    }),
    ApiResponse({ status: HttpStatus.OK, type: Boolean })
  ];
  return CombineDecorators(setDutyStatusDecorators);
}
