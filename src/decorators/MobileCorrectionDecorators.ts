import { Put, SetMetadata } from '@nestjs/common';
import {
  ApiOkResponse,
  getSchemaPath,
  ApiExtraModels,
  ApiBody,
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

export default function mobileCorrectionDecorators() {
  const mobileCorrectionDecorators: Array<CombineDecoratorType> = [
    Put('driverLog'),
    SetMetadata('permissions', [HOS.EDIT_LOG]),
    ApiExtraModels(EditLogEntryRequestModel, Array<EditLogEntryRequestModel>),
    ApiBody({
      examples: {
        'example 1': { value: '' },
      },
      schema: {
        anyOf: [
          {
            type: 'array',
            items: { $ref: getSchemaPath(EditLogEntryRequestModel) },
          },
          {
            $ref: getSchemaPath(EditLogEntryRequestModel),
          },
        ],
      },
    }),
    ApiOkResponse({
      content: {
        'application/json': {
          examples: {
            'example 1': { value: '' },
          },
        },
      },
    }),
  ];
  return CombineDecorators(mobileCorrectionDecorators);
}