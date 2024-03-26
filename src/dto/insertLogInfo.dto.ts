import { IsNotEmpty, IsOptional } from 'class-validator';
import { InsertInfoLog } from './insertInfoLog.dto';
// import { signature } from '../../../logEld-TenantBackendMicroservices-Units-Future/src/models/signaturesModel';

export class InsertLogInfoBodyDto {
  @IsNotEmpty({ message: 'Driver ID  is a required field!' })
  driverId: String;

  @IsNotEmpty()
  date: String;
    @IsOptional()
  signature: String;
    @IsNotEmpty()
    time: String;
  @IsNotEmpty()
    type: String;
  @IsOptional()
    sqID:String
  @IsOptional()
    statusInfo: InsertInfoLog
  
    
}
