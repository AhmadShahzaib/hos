import { Patch, SetMetadata } from '@nestjs/common';

import {
  CombineDecorators,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function notifyDriverAboutCorrection() {
  const notifyDriverAboutCorrection = [
    Patch('notify/driver'),
    SetMetadata('permissions', [HOS.LIVE]),
  ];
  return CombineDecorators(notifyDriverAboutCorrection);
}
