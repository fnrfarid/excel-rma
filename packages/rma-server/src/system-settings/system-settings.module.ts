import { Module, Global, HttpModule } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SettingsController } from './controllers/settings/settings.controller';
import { SetupController } from './controllers/setup/setup.controller';
import { SetupService } from './controllers/setup/setup.service';
import { SystemSettingsAggregates } from './aggregates';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerSettings } from './entities/server-settings/server-settings.entity';
import { DEFAULT } from '../constants/typeorm.connection';
import { ServerSettingsService } from './entities/server-settings/server-settings.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ServerSettings], DEFAULT),
    HttpModule,
    CqrsModule,
  ],
  providers: [SetupService, ServerSettingsService, ...SystemSettingsAggregates],
  controllers: [SettingsController, SetupController],
  exports: [SetupService, ServerSettingsService, ...SystemSettingsAggregates],
})
export class SystemSettingsModule {}
