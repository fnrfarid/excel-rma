import { IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateSalesReturnDto {
  @IsNotEmpty()
  docstatus: number;

  @IsNotEmpty()
  customer: string;

  @IsNotEmpty()
  company: string;

  @IsNotEmpty()
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
  credit_note_items: SalesReturnItemDto[];
}

export class SalesReturnItemDto {
  @IsNotEmpty()
  item_code: string;

  @IsNotEmpty()
  qty: number;

  @IsNotEmpty()
  rate: number;

  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  @IsNumber()
  has_serial_no: number;

  @IsNotEmpty()
  against_sales_invoice: string;

  @IsNotEmpty()
  serial_no: any;
  // "12348\n12349\n12350"
}
