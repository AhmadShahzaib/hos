import { Get, Put, Query, SetMetadata } from '@nestjs/common';
import {
  ApiOkResponse,
  getSchemaPath,
  ApiExtraModels,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { LogEntryRequestModel } from 'models/logEntry.request.model';
import { AppDeviceType, LogActionType } from 'logs/Enums';
import moment from 'moment';
import { EditLogEntryRequestModel } from 'models/editLogEntry.request.model';

export default function pendingEditRequestDecorator() {
 
  
  const pendingEditRequestDecorator = [
    Get('getPending'),
    SetMetadata('permissions', [HOS.EDIT_LOG]),
    ApiQuery({
      description: 'The date for which you need pending list',
      name: 'date',
      example: 'YYYY-MM-DD',
      required: true,
    }),

   
  ];
  return CombineDecorators(pendingEditRequestDecorator);
}
