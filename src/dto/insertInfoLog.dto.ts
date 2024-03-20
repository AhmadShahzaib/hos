import { IsNotEmpty, IsOptional } from 'class-validator';

export class InsertInfoLog {
  @IsNotEmpty({ message: 'Driver ID  is a required field!' })
  Time: String;

  @IsNotEmpty()
  status: String;
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
    @IsNotEmpty()
    engineHour: String;
    @IsOptional()
    truck: string
     @IsOptional()
     shippingDocument: string
     @IsOptional()
     tralier: string
  @IsOptional()
    notes:string
}
