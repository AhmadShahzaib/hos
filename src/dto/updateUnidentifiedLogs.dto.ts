import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class UpdateUnidentifiedLogsDto {
  @IsNotEmpty({ message: 'eventRecordStatus is a required field!' })
  eventRecordStatus: string;

  @IsNotEmpty({ message: 'eventRecordOrigin is a required field!' })
  eventRecordOrigin: string;
}
