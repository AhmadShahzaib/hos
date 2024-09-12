import { Get, Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function getLatLngFromAddressDecorator() {
  const getLatLngFromAddressDecorator: Array<CombineDecoratorType> = [
    Get('csv/getlatlng'),
    SetMetadata('permissions', ["e6v5e4st0"]),
  ];
  return CombineDecorators(getLatLngFromAddressDecorator);
}
