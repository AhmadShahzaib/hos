import { ResponseModel } from '../models/response.model';
import {
  ForbiddenException,
  Get,
  HttpStatus,
  Post,
  SetMetadata,
} from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CombineDecorators,
  CombineDecoratorType,
  HOS,
} from '@shafiqrathore/logeld-tenantbackend-common-future';

export default function GetDriverLiveDataDecorators() {
  const response1 = {
    statusCode: 404,
    message: 'No Data found for this driver',
    error: 'Not Found',
  };

  const response2 = {
    message: 'Last Data Found.',
    data: {
      id: '62d515a51e17696a8021230a',
      calendarStartDate: 1660836771,
      dutyStatus: 'OFF_DUTY',
      calendarEndDate: null,
      totalDriveTimeInSecondsSoFar: 0,
      totalDutyTimeInSecondsSoFar: 0,
      statusesData: {
        id: '62d515a51e17696a8021230b',
        _id: '62d515a51e17696a8021230b',
        offDuty: {
          startedAt: 1660837800,
          lastStartedAt: 1660856400,
          counter: 1,
          totalSecondsSpentSoFar: 10,
        },
        violations: [],
      },
      lastKnownLocation: {
        longitude: 18.566516,
        latitude: -68.435996,
      },
      lastEightDaysData: {
        onDuty: {
          totalSecondsSpentSoFar: 0,
        },
        offDuty: {
          totalSecondsSpentSoFar: 0,
        },
        onDriving: {
          totalSecondsSpentSoFar: 0,
        },
        onSleeperBerth: {
          totalSecondsSpentSoFar: 0,
        },
        onPersonalConveyance: {
          totalSecondsSpentSoFar: 0,
        },
        onYardMove: {
          totalSecondsSpentSoFar: 0,
        },
      },
    },
  };

  const response3 = {
    message: 'Last Data Found.',
    data: {
      id: '62d515a51e17696a8021230a',
      calendarStartDate: 1660836771,
      calendarEndDate: null,
      dutyStatus: 'ON_DUTY_NOT_DRIVING',
      totalDriveTimeInSecondsSoFar: 0,
      totalDutyTimeInSecondsSoFar: 4200,
      statusesData: {
        id: '62d515a51e17696a8021230b',
        _id: '62d515a51e17696a8021230b',
        offDuty: {
          startedAt: 1660856400,
          lastStartedAt: 1660863600,
          counter: 1,
          totalSecondsSpentSoFar: 1200,
        },
        onDuty: {
          startedAt: 1660836771,
          lastStartedAt: 1660836771,
          counter: 1,
          totalSecondsSpentSoFar: 4200,
        },
        violations: [],
      },
      lastKnownLocation: {
        longitude: 18.566516,
        latitude: -68.435996,
      },
      lastEightDaysData: {
        onDuty: {
          totalSecondsSpentSoFar: 0,
        },
        offDuty: {
          totalSecondsSpentSoFar: 0,
        },
        onDriving: {
          totalSecondsSpentSoFar: 0,
        },
        onSleeperBerth: {
          totalSecondsSpentSoFar: 0,
        },
        onPersonalConveyance: {
          totalSecondsSpentSoFar: 0,
        },
        onYardMove: {
          totalSecondsSpentSoFar: 0,
        },
      },
    },
  };

  const response4 = {
    message: 'Last Data Found.',
    data: {
      id: '62d515a51e17696a8021230a',
      calendarStartDate: 1660836771,
      calendarEndDate: null,
      dutyStatus: 'DRIVING',
      totalDriveTimeInSecondsSoFar: 7200,
      totalDutyTimeInSecondsSoFar: 4200,
      statusesData: {
        id: '62d515a51e17696a8021230b',
        _id: '62d515a51e17696a8021230b',
        offDuty: {
          startedAt: 1660837800,
          lastStartedAt: 1660856400,
          counter: 1,
          totalSecondsSpentSoFar: 1200,
        },
        onDuty: {
          startedAt: 1660856400,
          lastStartedAt: 1660863600,
          counter: 1,
          totalSecondsSpentSoFar: 4200,
        },
        onDriving: {
          startedAt: 1660837006,
          lastStartedAt: 1660837246,
          counter: 1,
          totalSecondsSpentSoFar: 7200,
        },
      },
      lastKnownLocation: {
        longitude: 18.566516,
        latitude: -68.435996,
      },
      lastEightDaysData: {
        onDuty: {
          totalSecondsSpentSoFar: 0,
        },
        offDuty: {
          totalSecondsSpentSoFar: 0,
        },
        onDriving: {
          totalSecondsSpentSoFar: 0,
        },
        onSleeperBerth: {
          totalSecondsSpentSoFar: 0,
        },
        onPersonalConveyance: {
          totalSecondsSpentSoFar: 0,
        },
        onYardMove: {
          totalSecondsSpentSoFar: 0,
        },
      },
    },
  };

  const getDriverLiveDataDecorators: Array<CombineDecoratorType> = [
    Get('live/:id'),
    SetMetadata('permissions', ['90nfnafe']),
    ApiParam({
      name: 'id',
      description: 'Driver id (system generated id) is required.',
      example: '',
      required: true,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      content: {
        'application/json': {
          examples: {
            'example 1': { value: response1 },
            'example 2': { value: response2 },
            'example 3': { value: response3 },
            'example 4': { value: response4 },
          },
        },
      },
    }),
  ];
  return CombineDecorators(getDriverLiveDataDecorators);
}
