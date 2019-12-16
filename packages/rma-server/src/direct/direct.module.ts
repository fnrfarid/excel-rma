import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectController } from './controllers/direct/direct.controller';
import { DirectService } from './aggregates/direct/direct.service';
import { FrappeToken } from './entities/frappe-token/frappe-token.entity';
import { FrappeTokenService } from './entities/frappe-token/frappe-token.service';
import { DEFAULT } from '../constants/typeorm.connection';
import { RequestState } from './entities/request-state/request-state.entity';
import { RequestStateService } from './entities/request-state/request-state.service';
import { CleanExpiredTokenCacheService } from '../auth/schedulers/clean-expired-token-cache/clean-expired-token-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FrappeToken, RequestState], DEFAULT),
    HttpModule,
  ],
  controllers: [DirectController],
  providers: [
    DirectService,
    FrappeTokenService,
    RequestStateService,
    CleanExpiredTokenCacheService,
  ],
  exports: [
    DirectService,
    FrappeTokenService,
    RequestStateService,
    CleanExpiredTokenCacheService,
  ],
})
export class DirectModule {}
