import { ApiProperty } from '@nestjs/swagger';
import { DutyType } from './dutyType.model';
import { StatusesDocument } from '../mongoDb/document/document';
import { LeanDocument } from 'mongoose';
export class Status {
  @ApiProperty()
  id: string;

  @ApiProperty()
  onDuty?: DutyType;

  @ApiProperty()
  onBreak?: DutyType;

  @ApiProperty()
  onDriving?: DutyType;

  @ApiProperty()
  sleeperBerth?: DutyType;

  @ApiProperty()
  offDuty?: DutyType;
  constructor(status: StatusesDocument) {
    this.id = status.id
    const jsonStatus = status?.toJSON?.() ?? status;
    Object.keys(jsonStatus).forEach((key) => {
      this[key] = status[key];
    });
  }
}
