import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogsEntryDocument } from '../mongoDb/document/document';
import { PartialStatusesType } from 'logs/types';
import { AppDeviceType } from 'logs/Enums';

export class LogEntryResponseModel {
  @ApiProperty()
  id: string;

  @ApiProperty()
  statusesData: PartialStatusesType;

  @ApiProperty()
  actionType: string;

  @ApiProperty()
  actionDate: Number;

  @ApiProperty()
  geoLocation?: {
    longitude: number;
    latitude: number;
    address?: string;
  };

  @ApiProperty()
  odoMeterMillage?: number;

  @ApiProperty()
  odoMeterSpeed?: number;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  engineHours?: number;

  @ApiProperty()
  engineRPMs?: number;

  @ApiPropertyOptional()
  editRequest?: LogsEntryDocument[];

  @ApiPropertyOptional()
  updated?: LogsEntryDocument[];

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  OSversion?: String;

  @ApiProperty()
  deviceVersion?: String;

  @ApiProperty()
  appVersion?: String;

  @ApiProperty()
  deviceType: String;

  @ApiPropertyOptional()
  sequenceNumber?: number;

  @ApiPropertyOptional()
  deviceModel?: String;

  @ApiPropertyOptional()
  eldType?: String;

  @ApiPropertyOptional()
  malfunction?: String;

  constructor(logEntry: LogsEntryDocument) {
    this.id = logEntry.id;
    this.actionType = logEntry.actionType;
    this.actionDate = logEntry.actionDate;
    this.geoLocation = logEntry.geoLocation;
    this.statusesData = logEntry.statusesData;
    this.odoMeterMillage = logEntry.odoMeterMillage;
    this.odoMeterSpeed = logEntry.odoMeterSpeed;
    this.engineHours = logEntry.engineHours;
    this.engineRPMs = logEntry.engineRPMs;
    this.address = logEntry.address;
    this.notes = logEntry.notes;
    this.deviceVersion = logEntry.deviceVersion;
    this.appVersion = logEntry.appVersion;
    this.OSversion = logEntry.OSversion;
    this.deviceType = logEntry.deviceType;
    this.sequenceNumber = logEntry.sequenceNumber;
    this.deviceModel = logEntry.deviceModel;
    this.eldType = logEntry.eldType;
    if (logEntry?.address) {
      this.geoLocation.address = logEntry.address;
    }
    if (logEntry?.editRequest && logEntry?.editRequest.length > 0) {
      this.editRequest = logEntry.editRequest;
    }
    if (logEntry?.updated && logEntry?.updated.length > 0) {
      this.updated = logEntry.updated;
    }
    if (logEntry?.malfunction ) {
      this.malfunction = logEntry.malfunction;
    }
  }
}
