import { Module, HttpModule } from '@nestjs/common';
import { SyncAggregateService } from './aggregates/sync-aggregate/sync-aggregate.service';
import { AuthModule } from '../auth/auth.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [AuthModule, SystemSettingsModule, HttpModule],
  providers: [SyncAggregateService],
  exports: [SyncAggregateService],
})
export class SyncModule {}
