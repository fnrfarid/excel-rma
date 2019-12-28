import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesPageModule } from './sales/sales.module';
import { AddSalesInvoicePageModule } from './add-sales-invoice/add-sales-invoice.module';
import { SalesService } from './services/sales.service';
import { MaterialModule } from '../material/material.module';
// import { SatPopoverModule } from '@ncstate/sat-popover';

@NgModule({
  declarations: [],

  imports: [
    CommonModule,
    SalesPageModule,
    AddSalesInvoicePageModule,
    MaterialModule,
    // SatPopoverModule,
  ],
  exports: [SalesPageModule, AddSalesInvoicePageModule],
  providers: [SalesService],
})
export class SalesUiModule {}
