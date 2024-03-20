import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogsEntryDocument } from '../mongoDb/document/document';
import { Status } from './status.model';
import { PartialStatusesType } from 'logs/types';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { AppDeviceType, LogActionType } from 'logs/Enums';
import { LogEntryRequestModel } from './logEntry.request.model';

export class ExtendedLogEntryModel extends LogEntryRequestModel {
  @ApiPropertyOptional()
  id: String;
  @ApiPropertyOptional()
  isApproved?: Boolean;
}

export class EditLogEntryRequestModel {
  @ApiPropertyOptional()
  driverId?: String;

  @ApiPropertyOptional()
  tenantId?: String;

  @ApiProperty()
  logs: Array<Array<ExtendedLogEntryModel>>;

}
