import { Module, Global } from '@nestjs/common';
import { SettingsController } from './controllers/settings/settings.controller';
import { SetupController } from './controllers/setup/setup.controller';
import { SetupService } from './controllers/setup/setup.service';
import { SystemSettingsAggregates } from './aggregates';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerSettings } from './entities/server-settings/server-settings.entity';
import { DEFAULT } from '../constants/typeorm.connection';
import { ServerSettingsService } from './entities/server-settings/server-settings.service';
import { AgendaProvider } from './providers/agenda.provider';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ServerSettings], DEFAULT)],
  providers: [
    SetupService,
    ServerSettingsService,
    ...SystemSettingsAggregates,
    AgendaProvider,
  ],
  controllers: [SettingsController, SetupController],
  exports: [
    SetupService,
    ServerSettingsService,
    ...SystemSettingsAggregates,
    AgendaProvider,
  ],
})
export class SystemSettingsModule {}
