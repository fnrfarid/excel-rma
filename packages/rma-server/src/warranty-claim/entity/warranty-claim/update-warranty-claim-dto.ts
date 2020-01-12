import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class UpdateWarrantyClaimDto {
  @IsNotEmpty()
  uuid: string;

  @IsOptional()
  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  supplier: string;

  @IsOptional()
  @IsString()
  status: string;
}
