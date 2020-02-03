import { IsOptional, IsEnum } from 'class-validator';
import { QuerySort } from './sort.enum';

export class SalesInvoiceListQueryDto {
  @IsOptional()
  offset: number;

  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;

  @IsOptional()
  @IsEnum(QuerySort)
  sort: string;

  @IsOptional()
  filter_query: string;
}
