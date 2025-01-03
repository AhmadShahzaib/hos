import { Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function getLocationDecorators() {
  const getLocationDecorators: Array<CombineDecoratorType> = [
    Post('csv/getLocation'),
    SetMetadata('permissions', ["e6v5e4st0"]),
    ApiParam({
        name: 'lat',
        description: "driverId is required",
        required: true
      }),
  ApiParam({
        name: 'long',
        description: "driverId is required",
        required: true
  }),
 
  ];
  return CombineDecorators(getLocationDecorators);
}
