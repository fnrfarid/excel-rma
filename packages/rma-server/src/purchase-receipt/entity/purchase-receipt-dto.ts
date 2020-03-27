import {
  IsNotEmpty,
  IsString,
  IsNumber,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseReceiptItemDto {
  @IsNotEmpty()
  @IsString()
  item_code: string;

  @IsNotEmpty()
  @IsString()
  item_name: string;

  @IsNotEmpty()
  @IsString()
  warehouse: string;

  purchase_order?: string;

  @IsOptional()
  @IsNumber()
  has_serial_no: number;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  serial_no: any;

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

export class PurchaseReceiptDto {
  @IsNotEmpty()
  @IsString()
  purchase_invoice_name: string;

  @IsNotEmpty()
  @IsString()
  naming_series: string;

  @IsNotEmpty()
  @IsString()
  supplier: string;

  @IsNotEmpty()
  @IsString()
  posting_date: string;

  @IsNotEmpty()
  @IsString()
  posting_time: string;

  @IsNotEmpty()
  @IsString()
  company: string;

  docstatus?: number;

  is_return?: number;

  @IsNotEmpty()
  @IsNumber()
  total_qty: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => PurchaseReceiptItemDto)
  items: PurchaseReceiptItemDto[];
}
