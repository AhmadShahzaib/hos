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
  longitude: string;

  // @IsNotEmpty({ message: 'latitude should not be empty!!' })
  @IsOptional()
  latitude: string;

  // @IsNotEmpty({ message: 'address should not be empty!!' })
  @IsOptional()
  address: string;
}
class unidentifiedLogObject {
  @IsOptional()
  // @IsNumber()
  eventSequenceIdNumber: string;

  @IsNotEmpty({ message: 'eventRecordStatus should not be empty!!' })
  eventRecordStatus: string;

  @IsNotEmpty({ message: 'eventRecordOrigin should not be empty!!' })
  eventRecordOrigin: string;

  @IsOptional()
  eventType: string;

  @IsOptional()
  eventCode: string;

  @IsNotEmpty({ message: 'eventDate should not be empty!!' })
  eventDate: string;

  @IsNotEmpty({ message: 'eventTime should not be empty!!' })
  eventTime: string;

  @IsNotEmpty({ message: 'accumulatedVehicleMiles should not be empty!!' })
  // @IsNumber()
  accumulatedVehicleMiles: string;

  @IsNotEmpty({ message: 'accumulatedEngineHours should not be empty!!' })
  // @IsNumber()
  accumulatedEngineHours: string;

  @IsNotEmpty({ message: 'eventLatitude should not be empty!!' })
  eventLatitude: string;

  @IsNotEmpty({ message: 'eventLongitude should not be empty!!' })
  eventLongitude: string;

  @IsNotEmpty({
    message: 'distanceSinceLastValidCoordinates should not be empty!!',
  })
  distanceSinceLastValidCoordinates: string;

  @IsNotEmpty({ message: 'correspondingCmvOrderNumber should not be empty!!' })
  correspondingCmvOrderNumber: string;

  @IsNotEmpty({
    message: 'malfunctionIndicatorStatusForEld should not be empty!!',
  })
  malfunctionIndicatorStatusForEld: string;

  @IsNotEmpty({ message: 'eventDataCheckValue should not be empty!!' })
  eventDataCheckValue: string;

  @IsNotEmpty({ message: 'lineDataCheckValue should not be empty!!' })
  lineDataCheckValue: string;

  @IsNotEmpty({ message: 'cmvVinNo should not be empty!!' })
  cmvVinNo: string;

  @IsNotEmpty({ message: 'eldNumber should not be empty!!' })
  eldNumber: string;

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
  distance: string;
  @IsNotEmpty({ message: 'duration should not be empty!!' })
  duration: string;

  @IsNotEmpty({ message: 'vehicleId should not be empty!!' })
  vehicleId: string;

  @IsNotEmpty({ message: 'startEngineHour should not be empty!!' })
  @IsOptional()
  startEngineHour: string;

  @IsNotEmpty({ message: 'endEngineHour should not be empty!!' })
  @IsOptional()
  endEngineHour: string;

  @IsNotEmpty({ message: 'startVehicleMiles should not be empty!!' })
  @IsOptional()
  startVehicleMiles: string;

  @IsNotEmpty({ message: 'endVehicleMiles should not be empty!!' })
  @IsOptional()
  endVehicleMiles: string;

  @IsNotEmpty({ message: 'startDate should not be empty!!' })
  startDate: string;

  @IsNotEmpty({ message: 'endDate should not be empty!!' })
  endDate: string;

  @IsNotEmpty({ message: 'startTime should not be empty!!' })
  startTime: string;

  @IsNotEmpty({ message: 'endTime should not be empty!!' })
  endTime: string;
  @IsNotEmpty({ message: 'tenantId should not be empty!!' })
  tenantId:string;
}
export class CreateUnidentifiedLogsDto {
  @ValidateNested({ each: true })
  @Type(() => unidentifiedLogObject)
  unidentifiedLogs: unidentifiedLogObject[];
}
