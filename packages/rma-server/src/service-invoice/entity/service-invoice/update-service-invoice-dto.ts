import { IsNotEmpty } from 'class-validator';
export class UpdateServiceInvoiceDto {
  @IsNotEmpty()
  uuid: string;
}
