import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { AddSalesInvoicePageModule } from '../sales-ui/add-sales-invoice/add-sales-invoice.module';
import { WarrantyService } from './warranty/warranty.service';

@NgModule({
  declarations: [],

  imports: [CommonModule, AddSalesInvoicePageModule, MaterialModule],
  exports: [AddSalesInvoicePageModule, AddSalesInvoicePageModule],
  providers: [WarrantyService],
})
export class SalesUiModule {}
