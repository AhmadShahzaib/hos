import { ApiProperty } from '@nestjs/swagger';

class LocationModel {
  @ApiProperty()
  longitude: number;
  @ApiProperty()
  latitude: number;
}

export class LastKnownLocationRequest {
  @ApiProperty()
  lastKnownLocation: LocationModel;

  @ApiProperty()
  secondLastKnownLocation: LocationModel;

}
