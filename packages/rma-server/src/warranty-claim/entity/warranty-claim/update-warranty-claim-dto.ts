import { IsNotEmpty } from 'class-validator';
export class UpdateWarrantyClaimDto {
  @IsNotEmpty()
  uuid: string;
}
