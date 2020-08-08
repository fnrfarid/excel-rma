import { IsOptional } from 'class-validator';

export class JobQueueListQueryDto {
  @IsOptional()
  offset: number;

  @IsOptional()
  limit: number;

  @IsOptional()
  search: string;

  @IsOptional()
  sort: string;

  @IsOptional()
  filter_query: string;
}

export class ExcelDataImportWebhookDto {
  @IsOptional()
  uuid: string;

  @IsOptional()
  success_log: string;

  @IsOptional()
  error_log: string;
}
