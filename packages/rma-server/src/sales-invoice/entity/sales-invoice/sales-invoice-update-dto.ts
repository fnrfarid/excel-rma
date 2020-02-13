import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SALES_INVOICE_STATUS_ENUM } from '../../../constants/app-strings';

export class SalesInvoiceUpdateDto {
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  customer: string;

  @IsOptional()
  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  posting_date: string;

  @IsOptional()
  @IsString()
  posting_time: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(SALES_INVOICE_STATUS_ENUM)
  status: string;

  @IsOptional()
  @IsNumber()
  set_posting_time: number;

  @IsOptional()
  @IsString()
  due_date: string;

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
  @IsString()
  contact_email: string;

  @IsOptional()
  @IsString()
  territory: string;

  @IsOptional()
  @IsNumber()
  update_stock: number;

  @IsOptional()
  @IsNumber()
  total_qty: number;

  @IsOptional()
  @IsNumber()
  base_total: number;

  @IsOptional()
  @IsNumber()
  base_net_total: number;

  @IsOptional()
  @IsNumber()
  total: number;

  @IsOptional()
  @IsNumber()
  net_total: number;

  @IsOptional()
  @IsNumber()
  pos_total_qty: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ItemDto)
  items: ItemDto[];

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

  @IsOptional()
  isCampaign: boolean;
}

export class TaxDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  charge_type: string;

  @IsOptional()
  @IsNumber()
  tax_amount: number;

  @IsOptional()
  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  account_head: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  rate: number;
}

export class ItemDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  owner: string;

  @IsOptional()
  @IsString()
  item_code: string;

  @IsOptional()
  @IsString()
  item_name: string;

  @IsOptional()
  @IsNumber()
  qty: number;

  @IsOptional()
  @IsNumber()
  rate: number;

  @IsOptional()
  @IsNumber()
  amount: number;
}
