import { Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function InsertLogDriverCsvLogDecorator() {
  const InsertLogDriverCsvLogDecorator: Array<CombineDecoratorType> = [
    Post('csv/insertLogInfo'),
    SetMetadata('permissions', [HOS.GRAPH]),
    ApiParam({
        name: 'driverId',
        description: "driverId is required",
        required: true
      }),
  ApiParam({
        name: 'date',
        description: "driverId is required",
        required: true
  }),
  ApiParam({
        name: 'time',
        description: "driverId is required",
        required: true
  }),
   ApiParam({
        name: 'type',
        description: "driverId is required",
        required: true
      }),
  ];
  return CombineDecorators(InsertLogDriverCsvLogDecorator);
}
