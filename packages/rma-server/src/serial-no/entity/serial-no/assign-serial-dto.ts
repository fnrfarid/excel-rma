import { SerialNoDto } from './serial-no-dto';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignSerialDto {
  @IsNotEmpty()
  @IsString()
  sales_invoice_name: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SerialNoDto)
  serials: SerialNoDto[];
}
