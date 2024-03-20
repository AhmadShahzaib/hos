import { Delete, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function DeleteDriverCsvLogDecorator() {
  const DeleteDriverCsvLogDecorator: Array<CombineDecoratorType> = [
    Delete('csv/delete/log/:driverId'),
    SetMetadata('permissions', [HOS.ADD_LOG]),
    ApiParam({
        name: 'driverId',
        description: "driverId is required",
        required: true
      }),
    ApiQuery({
      name: 'date',
      description: 'date is required',
      required: true,
    }),
  ];
  return CombineDecorators(DeleteDriverCsvLogDecorator);
}
