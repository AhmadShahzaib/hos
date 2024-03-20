import { Get, Patch, Put, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function CreateMissingIntermediatesDecorator() {
  const CreateMissingIntermediatesDecorator: Array<CombineDecoratorType> = [
    Get('csv/missing-intermediates'),
    SetMetadata('permissions', [HOS.ADD_LOG]),
    // ApiParam({
    //   name: 'driverId',
    //   description: 'driverId is required',
    //   required: true,
    // }),
    // ApiQuery({
    //   name: 'date',
    //   description: 'date is required',
    //   required: true,
    // }),
    // ApiQuery({
    //   name: 'type',
    //   description: 'type is required',
    //   required: true,
    //   enum: [0, 1], // 0 = auto, 1 = manual
    // }),
  ];
  return CombineDecorators(CreateMissingIntermediatesDecorator);
}