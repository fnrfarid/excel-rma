import { IsOptional, IsString } from 'class-validator';

export class WarrantyClaimDto {
  @IsOptional()
  @IsString()
  claim_no: string;

  @IsOptional()
  @IsString()
  claim_type: string;

  @IsOptional()
  @IsString()
  received_date: string;

  @IsOptional()
  @IsString()
  deliver_date: string;

  @IsOptional()
  @IsString()
  customer_third_party: string;

  @IsOptional()
  @IsString()
  item_code: string;

  @IsOptional()
  @IsString()
  claimed_serial: string;

  @IsOptional()
  @IsString()
  invoice_no: string;

  @IsOptional()
  @IsString()
  service_charge: string;

  @IsOptional()
  @IsString()
  claim_status: string;

  @IsOptional()
  @IsString()
  warranty_status: string;

  @IsOptional()
  @IsString()
  receiving_branch: string;

  @IsOptional()
  @IsString()
  delivery_branch: string;

  @IsOptional()
  @IsString()
  received_by: string;

  @IsOptional()
  @IsString()
  delivered_by: string;
}
