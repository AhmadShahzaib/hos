import { OmitType } from '@nestjs/swagger';
import { PartialStatusesType } from 'logs/types';
import LogsDocument from 'mongoDb/document/document';
import { ResponseModel } from './response.model';
import { Status } from './status.model';

export class DriverLiveData extends OmitType(ResponseModel, [
  'driver',
  'logs',
]) {
  constructor(
    data: LogsDocument | any,
    lastEightDaysData?: PartialStatusesType,
  ) {
    super(data);
    this.id = data.id;
    this.calendarStartDate = data.calendarStartDate;
    this.calendarEndDate = data.calendarEndDate;
    this.dutyStatus = data.dutyStatus;
    this.totalDriveTimeInSecondsSoFar = data.totalDriveTimeInSecondsSoFar;
    this.totalDutyTimeInSecondsSoFar = data.totalDutyTimeInSecondsSoFar;
    this.lastKnownLocation = data.lastKnownLocation;
    this.secondLastKnownLocation = data.secondLastKnownLocation;
    this.statusesData = new Status(data.statusesData);
    this.lastEightDaysData = lastEightDaysData;
    this.lastEntry = data.lastEntry;
  }
}
