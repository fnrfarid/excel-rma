import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseInvoice } from './purchase-invoice/purchase-invoice.entity';
import { PurchaseInvoiceService } from './purchase-invoice/purchase-invoice.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseInvoice]), CqrsModule],
  providers: [PurchaseInvoiceService],
  exports: [PurchaseInvoiceService],
})
export class PurchaseInvoiceEntitiesModule {}
