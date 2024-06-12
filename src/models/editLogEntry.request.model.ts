import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogsEntryDocument } from '../mongoDb/document/document';
import { Status } from './status.model';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { LogEntryRequestModel } from './logEntry.request.model';

export class ExtendedLogEntryModel extends LogEntryRequestModel {
  @ApiPropertyOptional()
  id: string;
  @ApiPropertyOptional()
  isApproved?: boolean;
}

export class EditLogEntryRequestModel {
  @ApiPropertyOptional()
  driverId?: string;

  @ApiPropertyOptional()
  tenantId?: string;

  @ApiProperty()
  logs: Array<Array<ExtendedLogEntryModel>>;

}
