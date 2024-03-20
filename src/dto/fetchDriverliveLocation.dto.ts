import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmpty,
  IsNotEmpty,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';

export class FetchDriverLiveLocationDto {
  @IsNotEmpty({ message: 'driverId is required!' })
  driverId: string;

  @IsOptional()
  date: string;

  @IsOptional()
  time: string;
}
