import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesPageModule } from './sales/sales.module';
import { AddSalesInvoicePageModule } from './add-sales-invoice/add-sales-invoice.module';
import { SalesService } from './services/sales.service';
import { MaterialModule } from '../material/material.module';
import { ViewSalesInvoicePageModule } from './view-sales-invoice/view-sales-invoice.module';

@NgModule({
  declarations: [],

  imports: [
    CommonModule,
    SalesPageModule,
    AddSalesInvoicePageModule,
    MaterialModule,
    ViewSalesInvoicePageModule,
  ],
  exports: [
    SalesPageModule,
    AddSalesInvoicePageModule,
    ViewSalesInvoicePageModule,
  ],
  providers: [SalesService],
})
export class SalesUiModule {}