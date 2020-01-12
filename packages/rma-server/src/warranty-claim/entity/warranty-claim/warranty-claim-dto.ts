import { IsOptional, IsString } from 'class-validator';

export class WarrantyClaimDto {
  @IsOptional()
  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  claimsReceivedDate: string;

  @IsOptional()
  @IsString()
  supplier: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  serialNo: string;

  @IsOptional()
  @IsString()
  item_code: string;
}
