import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import {
  connectTypeORM,
  connectTypeORMTokenCache,
  TOKEN_CACHE_CONNECTION,
  DEFAULT,
} from './constants/typeorm.connection';
import { ConfigService } from './config/config.service';
import { TerminusModule } from '@nestjs/terminus';
import { TerminusOptionsService } from './system-settings/aggregates/terminus-options/terminus-options.service';
import { DirectModule } from './direct/direct.module';
import { CustomerWebhookController } from './customer/controllers/customer-webhook/customer-webhook.controller';
import { CustomerWebhookAggregateService } from './customer/aggregates/customer-webhook-aggregate/customer-webhook-aggregate.service';
import { CustomerModule } from './customer/customer.module';
import { ItemModule } from './item/Item.module';
import { SupplierModule } from './supplier/supplier.module';
import { SupplierWebhookController } from './supplier/controllers/supplier-webhook/supplier-webhook.controller';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRootAsync({
      name: TOKEN_CACHE_CONNECTION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: connectTypeORMTokenCache,
    }),
    TypeOrmModule.forRootAsync({
      name: DEFAULT,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: connectTypeORM,
    }),
    TerminusModule.forRootAsync({ useClass: TerminusOptionsService }),
    ConfigModule,
    AuthModule,
    SystemSettingsModule,
    DirectModule,
    CustomerModule,
    SupplierModule,
    ItemModule,
  ],
  controllers: [
    AppController,
    CustomerWebhookController,
    SupplierWebhookController,
  ],
  providers: [AppService, CustomerWebhookAggregateService],
})
export class AppModule {}
