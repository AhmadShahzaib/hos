import { IsNotEmpty, IsOptional } from 'class-validator';
import { InsertInfoLog } from './insertInfoLog.dto';
// import { signature } from '../../../logEld-TenantBackendMicroservices-Units-Future/src/models/signaturesModel';

export class InsertLogInfoBodyDto {
  @IsNotEmpty({ message: 'Driver ID  is a required field!' })
  driverId: string;

  @IsNotEmpty()
  date: string;
    @IsOptional()
  signature: string;
    @IsNotEmpty()
    time: string;
  @IsNotEmpty()
    type: string;
  @IsOptional()
    sqID:string
  @IsOptional()
    statusInfo: InsertInfoLog
  
    
}
