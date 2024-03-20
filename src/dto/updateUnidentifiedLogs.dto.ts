import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class UpdateUnidentifiedLogsDto {
  @IsNotEmpty({ message: 'eventRecordStatus is a required field!' })
  eventRecordStatus: String;

  @IsNotEmpty({ message: 'eventRecordOrigin is a required field!' })
  eventRecordOrigin: String;
}
