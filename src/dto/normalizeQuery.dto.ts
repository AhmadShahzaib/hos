import { IsNotEmpty, IsOptional } from 'class-validator';

export class NormalizeQueryDto {
  @IsNotEmpty({ message: 'date is a required field!' })
  date: String;

  @IsNotEmpty({ message: 'type is a required field!' })
  type: Number;
  @IsNotEmpty({ message: 'type is a required field! for Dr=0 for Pc=1' })
  normalizationType: Number;
}
