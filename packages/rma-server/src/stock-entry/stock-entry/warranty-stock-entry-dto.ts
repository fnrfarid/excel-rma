import { STOCK_ENTRY } from '../../constants/app-strings';
import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WarrantyStockEntryDto {
  docstatus?: 1;
  uuid?: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  warrantyClaimUuid: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  stock_entry_type: string;

  @IsOptional()
  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  remarks: string;

  @IsOptional()
  @IsString()
  posting_date: string;

  @IsOptional()
  @IsString()
  posting_time: string;

  @IsNotEmpty()
  @IsString()
  doctype: string = STOCK_ENTRY;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => WarrantyStockEntryItemDto)
  items: WarrantyStockEntryItemDto[];
}

export class WarrantyStockEntryItemDto {
  @IsOptional()
  @IsString()
  s_warehouse: string;

  @IsNotEmpty()
  @IsString()
  t_warehouse: string;

  @IsOptional()
  @IsString()
  transferWarehouse: string;

  @IsNotEmpty()
  @IsString()
  item_code: string;

  @IsOptional()
  @IsNumber()
  has_serial_no: number;

  @IsNotEmpty()
  @IsString()
  item_name: string;

  @IsNotEmpty()
  @IsNumber()
  qty: number;

  @IsNotEmpty()
  @IsArray()
  serial_no: string[];
}
