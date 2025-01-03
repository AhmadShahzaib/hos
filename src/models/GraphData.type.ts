import { ApiProperty } from '@nestjs/swagger';


class driverObject {
  @ApiProperty()
  id: string;
  @ApiProperty()
  tenantId: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
}
export class GraphDataType {
  @ApiProperty()
  status?: string;
  @ApiProperty()
  startedAt?: Date;
  @ApiProperty()
  lastStartedAt?: Date;
  @ApiProperty()
  totalSecondsSpendSoFar: number;
  @ApiProperty()
  actionDate: number;
  @ApiProperty()
  odoMeterMillage: number;
  @ApiProperty()
  odoMeterSpeed: number;
  @ApiProperty()
  engineHours: number;
  @ApiProperty()
  vehicleManualId: string;
  @ApiProperty()
  address: string;
  @ApiProperty()
  driver: driverObject;
  @ApiProperty()
  id: string;
  @ApiProperty()
  violations: Array<{ type: any; count: number }>;
  @ApiProperty()
  deviceType: string;
  @ApiProperty()
  eventType: string;
  @ApiProperty()
  actionType: string;
}
