import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectController } from './controllers/direct/direct.controller';
import { DirectService } from './aggregates/direct/direct.service';
import { DEFAULT } from '../constants/typeorm.connection';
import { RequestState } from './entities/request-state/request-state.entity';
import { RequestStateService } from './entities/request-state/request-state.service';
import { ErrorLogModule } from '../error-log/error-logs-invoice.module';

@Module({
  imports: [TypeOrmModule.forFeature([RequestState], DEFAULT), ErrorLogModule],
  controllers: [DirectController],
  providers: [DirectService, RequestStateService],
  exports: [DirectService, RequestStateService],
})
export class DirectModule {}
