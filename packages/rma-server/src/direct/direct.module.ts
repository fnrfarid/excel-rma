import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectController } from './controllers/direct/direct.controller';
import { DirectService } from './aggregates/direct/direct.service';
import { DEFAULT } from '../constants/typeorm.connection';
import { RequestState } from './entities/request-state/request-state.entity';
import { RequestStateService } from './entities/request-state/request-state.service';
import { CleanExpiredTokenCacheService } from '../auth/schedulers/clean-expired-token-cache/clean-expired-token-cache.service';
import { ErrorLogModule } from '../error-log/error-logs-invoice.module';

@Module({
  imports: [TypeOrmModule.forFeature([RequestState], DEFAULT), ErrorLogModule],
  controllers: [DirectController],
  providers: [
    DirectService,
    RequestStateService,
    CleanExpiredTokenCacheService,
  ],
  exports: [DirectService, RequestStateService, CleanExpiredTokenCacheService],
})
export class DirectModule {}
