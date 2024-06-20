import { IsNotEmpty, IsOptional } from 'class-validator';

export class NormalizeQueryDto {
  @IsNotEmpty({ message: 'date is a required field!' })
  date: string;

  @IsNotEmpty({ message: 'type is a required field!' })
  type: number;
  @IsNotEmpty({ message: 'type is a required field! for Dr=0 for Pc=1' })
  normalizationType: number;
}
