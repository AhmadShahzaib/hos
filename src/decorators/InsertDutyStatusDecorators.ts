import { Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function InsertDutyStatusDecorator() {
  const InsertDutyStatusDecorator: Array<CombineDecoratorType> = [
    Post('csv/insertDutyStatus'),
    SetMetadata('permissions', [HOS.ADD_LOG]),
    
  ];
  return CombineDecorators(InsertDutyStatusDecorator);
}
