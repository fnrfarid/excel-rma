import { Module, Global, Logger, HttpModule } from '@nestjs/common';
import { ConfigService } from './config.service';
import { LuxonProvider } from './luxon.provider';

@Global()
@Module({
  imports: [HttpModule],
  providers: [ConfigService, Logger, LuxonProvider],
  exports: [ConfigService, Logger, LuxonProvider],
})
export class ConfigModule {}
