import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreditLimitsDto {
  @IsNotEmpty()
  @IsString()
  company: string;

  @IsNotEmpty()
  @IsNumber()
  credit_limit: number;
}

export class CustomerWebhookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  owner: string;

  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  customer_type: string;

  @IsString()
  @IsNotEmpty()
  gst_category: string;

  @IsString()
  @IsNotEmpty()
  customer_group: string;

  @IsString()
  @IsNotEmpty()
  territory: string;

  @IsOptional()
  @IsString()
  payment_terms: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditLimitsDto)
  credit_limits: CreditLimitsDto;

  isSynced?: boolean;
  credit_days?: number;
}

export interface PaymentTemplateTermsInterface {
  invoice_portion: number;
  credit_days: number;
  credit_months: number;
}
