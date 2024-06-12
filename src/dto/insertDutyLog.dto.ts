import { IsNotEmpty, IsOptional } from 'class-validator';

export class InsertDutyStatusDTO {

 @IsNotEmpty()
 driverId: string;
  @IsNotEmpty()
  date: string;
  @IsNotEmpty()
  startTime: string;
    @IsNotEmpty()
    endTime: string;
 
    @IsNotEmpty()
    eventType: string;
    @IsNotEmpty()
  eventCode: string;
    @IsNotEmpty()
    lat: string;
    @IsNotEmpty()
  long: string;
    @IsNotEmpty()
    address: string;
    @IsNotEmpty()
  odometer: string;
    @IsOptional()
    engineHour: string;
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
