import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidateNested,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesReturnDto {
  @IsNotEmpty()
  docstatus: number;

  @IsNotEmpty()
  customer: string;

  @IsNotEmpty()
  company: string;

  @IsOptional()
  contact_email: string;

  @IsNotEmpty()
  posting_date: string;

  @IsNotEmpty()
  posting_time: string;

  @IsNotEmpty()
  is_return: boolean;

  @IsOptional()
  issue_credit_note: boolean;

  @IsOptional()
  return_against: string;

  @IsNotEmpty()
  set_warehouse: string;

  @IsNotEmpty()
  total_qty: number;

  @IsNotEmpty()
  total: number;

  @IsNotEmpty()
  items: SalesReturnItemDto[];

  @IsNotEmpty()
  delivery_note_names: string[];

  @IsOptional()
  pricing_rules: any[];

  @IsOptional()
  packed_items: any[];

  @IsOptional()
  taxes: any[];

  @IsOptional()
  sales_team: any[];

  @IsOptional()
  remarks: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalesReturnItemDto)
  credit_note_items: SalesReturnItemDto[];
}

export class SalesReturnItemDto {
  @IsNotEmpty()
  item_code: string;
  item_name?: string;

  @IsNotEmpty()
  @Max(-1)
  qty: number;

  @IsNotEmpty()
  rate: number;

  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  @IsNumber()
  has_serial_no: number;

  @IsOptional()
  against_sales_invoice: string;

  @IsOptional()
  serial_no: any;
}
