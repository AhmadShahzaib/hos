import { Patch, Put, SetMetadata } from '@nestjs/common';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function notifyDriverAboutEditInsertDecorator() {
  const notifyDriverAboutEditInsertDecorator: Array<CombineDecoratorType> = [
    Patch('/notify/driver'),
    SetMetadata('permissions', [HOS.EDIT_LOG]),
  ];
  return CombineDecorators(notifyDriverAboutEditInsertDecorator);
}
