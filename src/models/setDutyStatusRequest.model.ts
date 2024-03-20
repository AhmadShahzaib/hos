import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  IsNotEmptyObject,
  ValidateIf,
} from 'class-validator';
import { LogActionType } from 'logs/Enums';
import { LogEntry } from 'logs/types';

export class SetDutyStatusRequest {
  @ApiProperty({
    enum: LogActionType,
  })
  @IsEnum(LogActionType)
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  @IsObject()
  @IsNotEmptyObject()
  @ValidateIf(
    (data) =>
      data.status === LogActionType.DRIVING ||
      data.status === LogActionType.ON_DUTY_NOT_DRIVING,
  )
  logEntry: LogEntry;
}
