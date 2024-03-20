import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class PaginationDto {
  @IsNotEmpty({ message: 'PageNo is a required field!' })
  pageNo: String;
}
