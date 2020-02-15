import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class SerialNoDto {
  @IsNotEmpty()
  @IsString()
  serial_no: string;

  @IsNotEmpty()
  @IsString()
  item_code: string;

  @IsNotEmpty()
  @IsString()
  warranty_expiry_date: string;

  @IsNotEmpty()
  @IsString()
  company: string;

  @IsNotEmpty()
  @IsString()
  supplier: string;
}

export class ValidateSerialsDto {
  @IsNotEmpty()
  @IsArray()
  serials: string[];

  @IsNotEmpty()
  @IsString()
  item_code: string;

  @IsOptional()
  @IsString()
  validateFor: string;
}
