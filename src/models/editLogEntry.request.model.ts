import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogsEntryDocument } from '../mongoDb/document/document';
import { Status } from './status.model';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
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
