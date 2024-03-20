import { ApiProperty } from '@nestjs/swagger';
export class DutyType {
  @ApiProperty()
  startedAt?: Date;
  @ApiProperty()
  lastStartedAt?: Date;
  @ApiProperty()
  counter: number;
  @ApiProperty()
  totalSecondsSpentSoFar: number;
}
