import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class PaginationDto {
  @IsOptional({ message: 'PageNo is a required field!' })
  pageNo: String;

  @IsOptional({ message: 'Limit is a required field!' })
  limit: String;

  @IsOptional()
  startDate: String;
  @IsOptional()
  endDate: String;
  @IsOptional()
  vinNo: String;
  @IsOptional()
  type: String;
  @IsOptional()
  tenantId:String;
}
