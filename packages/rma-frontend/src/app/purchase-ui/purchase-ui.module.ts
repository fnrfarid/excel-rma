import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchasePageModule } from './purchase/purchase.module';
import { AddPurchaseInvoicePageModule } from './add-purchase-invoice/add-purchase-invoice.module';
import { PurchaseService } from './services/purchase.service';

@NgModule({
  declarations: [],
  imports: [CommonModule, PurchasePageModule, AddPurchaseInvoicePageModule],
  exports: [PurchasePageModule, AddPurchaseInvoicePageModule],
  providers: [PurchaseService],
})
export class PurchaseUiModule {}
