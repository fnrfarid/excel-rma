import { Module } from '@nestjs/common';
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
import { CustomerModule } from './customer/customer.module';
import { ItemModule } from './item/item.module';
import { SupplierModule } from './supplier/supplier.module';
import { SerialNoModule } from './serial-no/serial-no.module';
import { SalesInvoiceModule } from './sales-invoice/sales-invoice.module';
import { WarrantyClaimModule } from './warranty-claim/warranty-claim.module';
import { DeliveryNoteEntitiesModule } from './delivery-note/entity/delivery-note-entity.module';
import { CreditNoteModule } from './credit-note/credit-note-invoice.module';
import { ReturnVoucherModule } from './return-voucher/return-voucher-invoice.module';
import { DeliveryNoteModule } from './delivery-note/delivery-note.module';
import { CommandModule } from './command/command.module';
import { PurchaseInvoiceModule } from './purchase-invoice/purchase-invoice.module';
import { PurchaseReceiptModule } from './purchase-receipt/purchase-receipt.module';
import { CommonDepModule } from './common-dep/common-dep.module';
import { ErrorLogModule } from './error-log/error-logs-invoice.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    CommonDepModule,
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
    CommandModule,
    CustomerModule,
    DeliveryNoteEntitiesModule,
    ReturnVoucherModule,
    ErrorLogModule,
    PurchaseReceiptModule,
    PurchaseInvoiceModule,
    SupplierModule,
    CreditNoteModule,
    SalesInvoiceModule,
    ItemModule,
    SerialNoModule,
    WarrantyClaimModule,
    DeliveryNoteModule,
    PurchaseOrderModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
