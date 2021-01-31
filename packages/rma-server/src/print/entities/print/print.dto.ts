import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Print {
  @IsString()
  print_type: string;
  t_warehouse: string;
  s_warehouse: string;
}

export class DeliveryChalanDto {
  @IsString()
  name: string;

  @IsString()
  customer_name: string;

  @ValidateNested()
  @Type(() => Print)
  print: Print;

  @IsString()
  company: string;

  @IsString()
  posting_date: string;

  @IsString()
  contact_email: string;

  @IsString()
  set_warehouse: string;

  @IsNumber()
  total_qty: number;

  @IsNumber()
  total: number;

  @IsString()
  in_words: string;

  @IsString()
  territory: string;

  @ValidateNested()
  @Type(() => DeliveryChalanItemDto)
  items: DeliveryChalanItemDto[];

  taxes?: any[];

  sales_team?: any[];

  address?: string;
  contact?: string;
  due_date?: string;
  sold_by?: string;
  created_by?: string;
  modified_by?: string;
}

export class DeliveryChalanItemDto {
  @IsString()
  item_code: string;

  @IsString()
  item_name: string;

  description?: string;

  brand?: string;

  warehouse?: string;

  @IsString()
  against_sales_invoice: string;

  @IsOptional()
  @IsString()
  expense_account: string;

  @IsOptional()
  @IsString()
  excel_serials: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  rate: number;

  @IsNumber()
  amount: number;
}
