import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
export class UpdateServiceInvoiceDto {
  @IsNotEmpty()
  uuid: string;

  @IsNotEmpty()
  @IsString()
  invoice_no: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsNumber()
  docstatus: string;
}
