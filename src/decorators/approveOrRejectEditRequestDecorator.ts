import { Post, Put, Query, SetMetadata } from '@nestjs/common';
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
import moment from 'moment';
import { EditLogEntryRequestModel } from 'models/editLogEntry.request.model';

export default function approveOrRejectEditRequestDecorator() {
  

  

  const approveOrRejectEditRequestDecorator = [
    Post('isapproved'),
    SetMetadata('permissions', ["e6v5e4st0"]),
    ApiQuery({
      description: 'The driverId only for backoffice',
      name: 'driverId',
      example: 'ADBH456GYVYGV445J645',
      required: false,
    }),

    // ApiExtraModels(EditLogEntryRequestModel, Array<EditLogEntryRequestModel>),
    // ApiBody({
    //   examples: {
    //     'example 1': { value: example1 },
    //   },
    //   schema: {
    //     anyOf: [
    //       {
    //         type: 'array',
    //         items: { $ref: getSchemaPath(EditLogEntryRequestModel) },
    //       },
    //       {
    //         $ref: getSchemaPath(EditLogEntryRequestModel),
    //       },
    //     ],
    //   },
    // }),
    // ApiOkResponse({
    //   content: {
    //     'application/json': {
    //       examples: {
    //         "example 1": { value: responseExample1 },
    //       },
    //     },
    //   },

    // })
  ];
  return CombineDecorators(approveOrRejectEditRequestDecorator);
}
