import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseInvoiceWebhookDto {
  @IsNotEmpty()
  @IsNumber()
  docstatus: number;

  @IsNotEmpty()
  @IsNumber()
  is_paid: number;

  @IsNotEmpty()
  @IsNumber()
  is_return: number;

  @IsNotEmpty()
  @IsNumber()
  update_stock: number;

  @IsNotEmpty()
  @IsNumber()
  total_qty: number;

  @IsNotEmpty()
  @IsNumber()
  base_total: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @IsNumber()
  total_advance: number;

  @IsNotEmpty()
  @IsNumber()
  outstanding_amount: number;

  @IsNotEmpty()
  @IsNumber()
  paid_amount: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  supplier: string;

  @IsNotEmpty()
  @IsString()
  supplier_name: string;

  @IsNotEmpty()
  @IsString()
  naming_series: string;

  @IsNotEmpty()
  @IsString()
  due_date: string;

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
  supplier_address: string;

  @IsNotEmpty()
  @IsString()
  address_display: string;

  @IsNotEmpty()
  @IsString()
  buying_price_list: string;

  @IsNotEmpty()
  @IsString()
  in_words: string;

  @IsNotEmpty()
  @IsString()
  credit_to: string;

  @IsNotEmpty()
  @IsString()
  against_expense_account: string;

  @IsNotEmpty()
  pricing_rules: any[];

  @IsNotEmpty()
  supplied_items: any[];

  @IsNotEmpty()
  taxes: any[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PurchaseInvoiceItemDto)
  items: PurchaseInvoiceItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PurchaseInvoiceAdvancesDto)
  advances: PurchaseInvoiceAdvancesDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PurchaseInvoicePaymentScheduleDto)
  payment_schedule: PurchaseInvoicePaymentScheduleDto[];
}

export class PurchaseInvoicePaymentScheduleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  due_date: string;

  @IsNotEmpty()
  @IsNumber()
  invoice_portion: number;

  @IsNotEmpty()
  @IsNumber()
  payment_amount: number;
}

export class PurchaseInvoiceAdvancesDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  parenttype: string;

  @IsNotEmpty()
  @IsString()
  reference_type: string;

  @IsNotEmpty()
  @IsString()
  reference_name: string;

  @IsNotEmpty()
  @IsString()
  reference_row: string;

  @IsNumber()
  @IsNotEmpty()
  advance_amount: number;

  @IsNumber()
  @IsNotEmpty()
  allocated_amount: number;
}

export class PurchaseInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  item_code: string;

  @IsString()
  @IsNotEmpty()
  item_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  item_group: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsString()
  @IsNotEmpty()
  warehouse: string;

  @IsString()
  @IsOptional()
  serial_no: string;

  @IsString()
  @IsNotEmpty()
  expense_account: string;

  @IsString()
  @IsNotEmpty()
  cost_center: string;

  @IsNumber()
  @IsNotEmpty()
  received_qty: number;

  @IsNumber()
  @IsNotEmpty()
  qty: number;

  @IsNumber()
  @IsNotEmpty()
  rejected_qty: number;

  @IsNumber()
  @IsNotEmpty()
  rate: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
