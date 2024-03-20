import {
  IsString,
  IsNumberString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkDeleteItemDto {
  @IsString({ message: `eventType should be string!` })
  eventType: string;

  @IsString({ message: `eventTime should be string!` })
  eventTime: string;

  @IsString({ message: `eventSequenceIdNumber should be string!` })
  eventSequenceIdNumber: string;
}

export class DeleteLogBody {
  // @ValidateNested({ each: true })
  // @Type(() => BulkDeleteItemDto)
  // @IsArray({ message: `bulkDelete should be an array!` })
  // bulkDelete: BulkDeleteItemDto[];
  eventSequenceIdNumber: string[];
}
