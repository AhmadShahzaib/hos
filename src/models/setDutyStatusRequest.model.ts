import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  IsNotEmptyObject,
  ValidateIf,
} from 'class-validator';


export class SetDutyStatusRequest {
  @ApiProperty()

  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  @IsObject()
  @IsNotEmptyObject()
 
  logEntry: any;
}
