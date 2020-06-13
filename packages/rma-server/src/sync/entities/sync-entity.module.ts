import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaJobService } from './agenda-job/agenda-job.service';
import { AgendaJob } from './agenda-job/agenda-job.entity';
import { JsonToCsvParserService } from './agenda-job/json-to-csv-parser.service';
import { DataImportService } from '../aggregates/data-import/data-import.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AgendaJob])],
  providers: [AgendaJobService, JsonToCsvParserService, DataImportService],
  exports: [AgendaJobService, JsonToCsvParserService, DataImportService],
})
export class SyncEntitiesModule {}
