import { IsNotEmpty, IsOptional } from 'class-validator';

export class NormalizeBodyDto {
  @IsNotEmpty({ message: 'eventSequenceIdNumber is a required field!' })
  eventSequenceIdNumber: string;

  @IsOptional()
  speed: string;
}
