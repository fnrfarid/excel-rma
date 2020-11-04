import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchasePageModule } from './purchase/purchase.module';
import { AddPurchaseInvoicePageModule } from './add-purchase-invoice/add-purchase-invoice.module';
import { PurchaseService } from './services/purchase.service';
import { ViewPurchaseInvoicePageModule } from './view-purchase-invoice/view-purchase-invoice.module';
import { MaterialModule } from '../material/material.module';
import { AssignSerialModule } from '../assign-serial/assign-serial.module';

@NgModule({
  declarations: [],

  imports: [
    AssignSerialModule,
    CommonModule,
    PurchasePageModule,
    AddPurchaseInvoicePageModule,
    MaterialModule,
    ViewPurchaseInvoicePageModule,
  ],
  exports: [
    PurchasePageModule,
    AddPurchaseInvoicePageModule,
    ViewPurchaseInvoicePageModule,
  ],
  providers: [PurchaseService],
})
export class PurchaseUiModule {}
