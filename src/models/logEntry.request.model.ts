import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogsEntryDocument } from '../mongoDb/document/document';
import { Status } from './status.model';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
export class LogEntryRequestModel {
 
  
  @ApiProperty()
  @IsOptional()
  @MaxLength(250)
  notes?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  actionDate: Number;

  @ApiProperty()
  geoLocation?: {
    address?: string;
    longitude: number;
    latitude: number;
  };

  @ApiProperty()
  odoMeterMillage?: number;

  @ApiProperty()
  odoMeterSpeed?: number;

  @ApiProperty()
  engineHours?: number;

  @ApiProperty()
  engineRPMs?: number;

  address?: string;

  @ApiProperty()
  @IsOptional()
  OSversion?: string;

  @ApiProperty()
  @IsOptional()
  deviceVersion?: string;

  @ApiProperty()
  @IsOptional()
  appVersion?: string;

 

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  annotation?: number;

  @ApiPropertyOptional()
  isEdited?: Boolean;

  @ApiProperty()
  @IsOptional()
  deviceModel?: string;

  @ApiProperty()
  @IsOptional()
  eldType?: string;
 
  @ApiProperty()
  @IsOptional()
  malfunction?: string;
}
