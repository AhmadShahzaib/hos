import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class PaginationDto {
  @IsOptional({ message: 'PageNo is a required field!' })
  pageNo: string;

  @IsOptional({ message: 'Limit is a required field!' })
  limit: string;

  @IsOptional()
  startDate: string;
  @IsOptional()
  endDate: string;
  @IsOptional()
  vinNo: string;
  @IsOptional()
  type: string;
  @IsOptional()
  tenantId:string;
}
