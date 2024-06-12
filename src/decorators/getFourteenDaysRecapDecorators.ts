import { ResponseModel } from '../models/response.model';
import { ForbiddenException, Get, HttpStatus, Post, SetMetadata } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function GetFourteenDaysRecapDecorators() {
  const response1 = {
    message: 'No Data Found',
    data: {},
  };

  const response2 = {
    message: 'Data Found',
    data: {
      '2022-08-18': {
        offDuty: {
          totalSecondsSpentSoFar: 18841,
        },
        hoursWorked: {
          totalSecondsSpentSoFar: 859,
        },
      },
      '2022-08-19': {
        hoursWorked: {
          totalSecondsSpentSoFar: 7200,
        },
      },
    },
  };

  const getFourteenDaysRecapDecorators: Array<CombineDecoratorType> = [
    Get('recap'),
    SetMetadata('permissions', [HOS.RECAP]),
    ApiResponse({
      status: HttpStatus.OK,
      content: {
        'application/json': {
          examples: {
            'No Data Resp': { value: response1 },
            'Data Found': { value: response2 },
          },
        },
      },
    }),
  ];
  return CombineDecorators(getFourteenDaysRecapDecorators);
}

export function GetFourteenDaysRecapDecoratorsMobile() {
  const response1 = {
    message: 'No Data Found',
    data: {},
  };

  const response2 = {
    message: 'Data Found',
    data: {
      '2022-08-18': {
        offDuty: {
          totalSecondsSpentSoFar: 18841,
        },
        hoursWorked: {
          totalSecondsSpentSoFar: 859,
        },
      },
      '2022-08-19': {
        hoursWorked: {
          totalSecondsSpentSoFar: 7200,
        },
      },
    },
  };

  const getFourteenDaysRecapDecoratorsMobile: Array<CombineDecoratorType> = [
    Get('recapmobile'),
    ApiResponse({
      status: HttpStatus.OK,
      content: {
        'application/json': {
          examples: {
            'No Data Resp': { value: response1 },
            'Data Found': { value: response2 },
          },
        },
      },
    }),
  ];
  return CombineDecorators(getFourteenDaysRecapDecoratorsMobile);
}