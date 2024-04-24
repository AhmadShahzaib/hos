import { ApiProperty } from '@nestjs/swagger';
import { Status } from './status.model';
import LogsDocument, { LogsEntryDocument } from 'mongoDb/document/document';

import { LogEntryResponseModel } from './logEntry.response.model';
export class ResponseModel {
  @ApiProperty()
  id: string;

  // @ApiProperty()
  // driverId: string;

  // @ApiProperty()
  // tenantId: string;

  @ApiProperty()
  driver: {
    id: String,
    tenantId: string,
    firstName: string,
    lastName: string,
  }

  @ApiProperty()
  calendarStartDate: Number;

  @ApiProperty()
  calendarEndDate: Number;


  @ApiProperty()
  statusesData: Status;

  @ApiProperty()
  dutyStatus: string;

  @ApiProperty()
  totalDriveTimeInSecondsSoFar: number;

  @ApiProperty()
  totalDutyTimeInSecondsSoFar: number;

  @ApiProperty({
    isArray: true,
    type: LogEntryResponseModel,
  })
  logs: Array<LogEntryResponseModel>;

  @ApiProperty()
  lastKnownLocation: {
    longitude: number;
    latitude: number;
  }

  @ApiProperty()
  secondLastKnownLocation: {
    longitude?: number;
    latitude?: number;
  }

  lastEntry?: LogsEntryDocument;

  lastEightDaysData?: any

  constructor(log: LogsDocument) {
    this.id = log.id;
    this.driver = log.driver;
    this.calendarStartDate = log.calendarStartDate;
    this.calendarEndDate = log.calendarEndDate;
    this.dutyStatus = log.dutyStatus;
    this.totalDriveTimeInSecondsSoFar = log.totalDriveTimeInSecondsSoFar;
    this.totalDutyTimeInSecondsSoFar = log.totalDutyTimeInSecondsSoFar;
    this.logs = log.logs.map((entry) => new LogEntryResponseModel(entry));
    this.lastKnownLocation = log.lastKnownLocation;
    this.secondLastKnownLocation = log.secondLastKnownLocation;
    this.statusesData = new Status(log.statusesData);
  }
}
