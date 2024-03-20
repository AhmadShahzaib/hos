import { ApiProperty } from '@nestjs/swagger';

export class AllDriverLogResponseModel {
  @ApiProperty()
  id: {
    driverId: String;
    calendarDate: Number;
  };
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  calendarStartDate?: Number;
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
