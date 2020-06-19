import {
  IsString,
  IsDate,
  IsNumber,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Item } from '../../../item/entity/item/item.entity';

export class ServiceInvoiceDto {
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  invoice_no: string;

  @IsDate()
  @IsNotEmpty()
  date: Date;

  @IsString()
  @IsNotEmpty()
  customer_third_party: string;

  @IsNumber()
  @IsNotEmpty()
  invoice_amount: number;

  @IsString()
  @IsNotEmpty()
  claim_no: string;

  @IsString()
  @IsOptional()
  remarks: string;

  @IsString()
  @IsNotEmpty()
  branch: string;

  @IsString()
  @IsNotEmpty()
  created_by: string;

  @IsString()
  @IsNotEmpty()
  submitted_by: string;

  @IsDate()
  @IsNotEmpty()
  posting_date: Date;

  @IsString()
  @IsOptional()
  customer_name: string;

  @IsString()
  @IsOptional()
  customer_address: string;

  @IsString()
  @IsOptional()
  customer_contact: string;

  @IsString()
  @IsOptional()
  third_party_name: string;

  @IsString()
  @IsOptional()
  third_party_address: string;

  @IsString()
  @IsOptional()
  third_party_contact: string;

  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsString()
  @IsNotEmpty()
  items: Item[];
}
