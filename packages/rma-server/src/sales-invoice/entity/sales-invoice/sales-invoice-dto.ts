import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SalesInvoiceDto {
  @IsNotEmpty()
  @IsString()
  customer: string;

  @IsNotEmpty()
  @IsString()
  company: string;

  @IsNotEmpty()
  @IsString()
  posting_date: string;

  @IsNotEmpty()
  @IsString()
  posting_time: string;

  @IsNotEmpty()
  @IsString()
  due_date: string;

  @IsNotEmpty()
  @IsString()
  contact_email: string;

  @IsNotEmpty()
  @IsString()
  territory: string;

  @IsNotEmpty()
  @IsNumber()
  update_stock: number;

  @IsNotEmpty()
  @IsNumber()
  total_qty: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsOptional()
  @IsNumber()
  set_posting_time: number;

  @IsOptional()
  @IsString()
  address_display: string;

  @IsOptional()
  @IsString()
  contact_person: string;

  @IsOptional()
  @IsString()
  contact_display: string;

  @IsOptional()
  @IsNumber()
  base_total: number;

  @IsOptional()
  @IsNumber()
  base_net_total: number;

  @IsOptional()
  @IsNumber()
  net_total: number;

  @IsOptional()
  @IsNumber()
  pos_total_qty: number;

  @IsOptional()
  pricing_rules: any[];

  @IsOptional()
  packed_items: any[];

  @IsOptional()
  timesheets: any[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TaxDto)
  taxes: TaxDto[];

  @IsOptional()
  advances: any[];

  @IsOptional()
  payment_schedule: any[];

  @IsOptional()
  payments: any[];

  @IsOptional()
  sales_team: any[];
}

export class TaxDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  charge_type: string;

  @IsNotEmpty()
  @IsNumber()
  tax_amount: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @IsString()
  account_head: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  rate: number;
}

export class ItemDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  owner: string;

  @IsNotEmpty()
  @IsString()
  item_code: string;

  @IsNotEmpty()
  @IsString()
  item_name: string;

  @IsNotEmpty()
  @IsNumber()
  qty: number;

  @IsNotEmpty()
  @IsNumber()
  rate: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
