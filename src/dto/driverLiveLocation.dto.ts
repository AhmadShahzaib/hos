import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmpty,
  IsNotEmpty,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';

export class DriverLiveLocationDto {
  @IsNotEmpty({ message: 'historyOfLocation is a required field!' })
  historyOfLocation: {};
}
