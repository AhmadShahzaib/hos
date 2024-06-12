import { IsNotEmpty, IsOptional } from 'class-validator';

export class InsertInfoLog {
  @IsNotEmpty({ message: 'Driver ID  is a required field!' })
  Time: string;

  @IsNotEmpty()
  status: string;
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
    @IsNotEmpty()
    engineHour: string;
    @IsOptional()
    truck: string
     @IsOptional()
     shippingDocument: string
     @IsOptional()
     tralier: string
  @IsOptional()
    notes:string
}
