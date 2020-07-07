import { IsNotEmpty, IsString } from 'class-validator';

export class StatusHistoryDto {
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @IsNotEmpty()
  @IsString()
  posting_date: Date;

  @IsNotEmpty()
  @IsString()
  time: Date;

  @IsNotEmpty()
  @IsString()
  status_from: string;

  @IsNotEmpty()
  @IsString()
  transfer_branch: string;

  @IsNotEmpty()
  @IsString()
  verdict: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  delivery_status: string;
}