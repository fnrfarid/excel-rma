import { STOCK_ENTRY } from '../../constants/app-strings';
import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StockEntryDto {
  docstatus?: 1;

  @IsNotEmpty()
  @IsString()
  stock_entry_type: string;

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
  doctype: string = STOCK_ENTRY;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => StockEntryItemDto)
  items: StockEntryItemDto[];
}

export class StockEntryItemDto {
  @IsOptional()
  @IsString()
  s_warehouse: string;

  @IsNotEmpty()
  @IsString()
  t_warehouse: string;

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
  amount: number;

  @IsNotEmpty()
  @IsString()
  serial_no: string;
}
