import { ResponseModel } from '../models/response.model';
import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { CombineDecorators, CombineDecoratorType, HOS } from '@shafiqrathore/logeld-tenantbackend-common-future';
export default function GetDriverProfileDataDecorators() {
  const getDriverProfileDataDecorators: Array<CombineDecoratorType> = [
    Get('profile/:id'),
    SetMetadata('permissions', [HOS.PROFILE]),
    ApiParam({
      name: 'id',
      description: 'Driver id (system generated id) is required.',
      required: true,
    }),
    ApiResponse({ status: HttpStatus.OK, type: ResponseModel })
  ];
  return CombineDecorators(getDriverProfileDataDecorators);
}
