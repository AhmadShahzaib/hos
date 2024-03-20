import { IsNotEmpty, IsOptional } from 'class-validator';

export class InsertDutyStatusDTO {

 @IsNotEmpty()
 driverId: String;
  @IsNotEmpty()
  date: String;
  @IsNotEmpty()
  startTime: String;
    @IsNotEmpty()
    endTime: String;
 
    @IsNotEmpty()
    eventType: String;
    @IsNotEmpty()
  eventCode: String;
    @IsNotEmpty()
    lat: String;
    @IsNotEmpty()
  long: String;
    @IsNotEmpty()
    address: String;
    @IsNotEmpty()
  odometer: String;
    @IsOptional()
    engineHour: String;
    @IsOptional()
    truck: string
     @IsOptional()
     shippingDocument: string
     @IsOptional()
     tralier: string
         @IsOptional()
    notes:string
    @IsOptional()
    state:string
}
