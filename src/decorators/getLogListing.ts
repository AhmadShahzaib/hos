

import { Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
    CombineDecorators,
    CombineDecoratorType,
    HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

let response1 = {
    message: 'No Data Found',
    data: [],
};

let response2 = {
    message: 'Data Found',
    data: {

        _id: {
            driverId: "633547b08dd3d18f1b225338",
            calendarStartDate: 1664436144
        },
        firstName: "tayyab",
        lastName: "khan",
        calenderDate: 1664436144,
        logDocumentId: "633547b08dd3d18f1b225338"

    },
};
export default function GetAllDriverLogDecorators() {
    const getAllDriverLogDecorators: Array<CombineDecoratorType> = [
        Get('alldriverslog'),
        SetMetadata('permissions', [HOS.LOG_LISTING]),
        ApiQuery({
            description: 'The date you want to see logListing for.',
            name: 'start',
            example: '2022-09-25',
            required:true
        }),
        ApiQuery({
            description: 'The date you want to see logListing for.',
            name: 'end',
            example: '2022-09-25',
            required:true
        }),
        ApiQuery({
            name: 'orderType',
            example: 'Ascending(1),Descending(-1)',
            enum: [1, -1],
            required: false,
        }),
        ApiQuery({
            name: 'pageNo',
            example: '1',
            description: 'The pageNo you want to get e.g 1,2,3 etc',
            required: false,
        }),
        ApiQuery({
            name: 'limit',
            example: '10',
            description: 'The number of records you want on one page.',
            required: false,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            content: {
              'application/json': {
                examples: {
                  'example 1': { value: response1 },
                  'example 2': { value: response2 }
                },
              },
            },
          }),
    ];
    return CombineDecorators(getAllDriverLogDecorators);
}