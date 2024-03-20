import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';

class GeoLocation {
  // @IsNotEmpty({ message: 'longitude should not be empty!!' })
  @IsOptional()
  longitude: String;

  // @IsNotEmpty({ message: 'latitude should not be empty!!' })
  @IsOptional()
  latitude: String;

  // @IsNotEmpty({ message: 'address should not be empty!!' })
  @IsOptional()
  address: String;
}
class unidentifiedLogObject {
  @IsOptional()
  // @IsNumber()
  eventSequenceIdNumber: String;

  @IsNotEmpty({ message: 'eventRecordStatus should not be empty!!' })
  eventRecordStatus: String;

  @IsNotEmpty({ message: 'eventRecordOrigin should not be empty!!' })
  eventRecordOrigin: String;

  @IsOptional()
  eventType: String;

  @IsOptional()
  eventCode: String;

  @IsNotEmpty({ message: 'eventDate should not be empty!!' })
  eventDate: String;

  @IsNotEmpty({ message: 'eventTime should not be empty!!' })
  eventTime: String;

  @IsNotEmpty({ message: 'accumulatedVehicleMiles should not be empty!!' })
  // @IsNumber()
  accumulatedVehicleMiles: String;

  @IsNotEmpty({ message: 'accumulatedEngineHours should not be empty!!' })
  // @IsNumber()
  accumulatedEngineHours: String;

  @IsNotEmpty({ message: 'eventLatitude should not be empty!!' })
  eventLatitude: String;

  @IsNotEmpty({ message: 'eventLongitude should not be empty!!' })
  eventLongitude: String;

  @IsNotEmpty({
    message: 'distanceSinceLastValidCoordinates should not be empty!!',
  })
  distanceSinceLastValidCoordinates: String;

  @IsNotEmpty({ message: 'correspondingCmvOrderNumber should not be empty!!' })
  correspondingCmvOrderNumber: String;

  @IsNotEmpty({
    message: 'malfunctionIndicatorStatusForEld should not be empty!!',
  })
  malfunctionIndicatorStatusForEld: String;

  @IsNotEmpty({ message: 'eventDataCheckValue should not be empty!!' })
  eventDataCheckValue: String;

  @IsNotEmpty({ message: 'lineDataCheckValue should not be empty!!' })
  lineDataCheckValue: String;

  @IsNotEmpty({ message: 'cmvVinNo should not be empty!!' })
  cmvVinNo: String;

  @IsNotEmpty({ message: 'eldNumber should not be empty!!' })
  eldNumber: String;

  @IsNotEmpty({ message: 'origin should not be empty!!' })
  @IsObject()
  @ValidateNested()
  @Type(() => GeoLocation)
  origin: GeoLocation;

  @IsNotEmpty({ message: 'destination should not be empty!!' })
  @IsObject()
  @ValidateNested()
  @Type(() => GeoLocation)
  destination: GeoLocation;

  // @IsNotEmpty({ message: 'distance should not be empty!!' })
  // distance: String;

  @IsOptional()
  distance: String;
  @IsNotEmpty({ message: 'duration should not be empty!!' })
  duration: String;

  @IsNotEmpty({ message: 'vehicleId should not be empty!!' })
  vehicleId: String;

  @IsNotEmpty({ message: 'startEngineHour should not be empty!!' })
  @IsOptional()
  startEngineHour: String;

  @IsNotEmpty({ message: 'endEngineHour should not be empty!!' })
  @IsOptional()
  endEngineHour: String;

  @IsNotEmpty({ message: 'startVehicleMiles should not be empty!!' })
  @IsOptional()
  startVehicleMiles: String;

  @IsNotEmpty({ message: 'endVehicleMiles should not be empty!!' })
  @IsOptional()
  endVehicleMiles: String;

  @IsNotEmpty({ message: 'startDate should not be empty!!' })
  startDate: String;

  @IsNotEmpty({ message: 'endDate should not be empty!!' })
  endDate: String;

  @IsNotEmpty({ message: 'startTime should not be empty!!' })
  startTime: String;

  @IsNotEmpty({ message: 'endTime should not be empty!!' })
  endTime: String;
  @IsNotEmpty({ message: 'tenantId should not be empty!!' })
  tenantId:String;
}
export class CreateUnidentifiedLogsDto {
  @ValidateNested({ each: true })
  @Type(() => unidentifiedLogObject)
  unidentifiedLogs: unidentifiedLogObject[];
}
