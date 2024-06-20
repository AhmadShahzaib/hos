import { ApiProperty } from '@nestjs/swagger';

export class AllDriverLogResponseModel {
  @ApiProperty()
  id: {
    driverId: string;
    calendarDate: number;
  };
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  calendarStartDate?: number;
  @ApiProperty()
  logDocumentId: string;
  @ApiProperty()
  firstName: string;

  constructor(log: any) {
    this.id = log._id;
    this.firstName = log.firstName;
    this.lastName = log.lastName;
    this.calendarStartDate = log.calendarStartDate;
    this.logDocumentId = log.logDocumentId;
  }
}
