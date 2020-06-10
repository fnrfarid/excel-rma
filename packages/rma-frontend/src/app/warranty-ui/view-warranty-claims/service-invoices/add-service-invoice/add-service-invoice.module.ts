import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddServiceInvoicePageRoutingModule } from './add-service-invoice-routing.module';

import { AddServiceInvoicePage } from './add-service-invoice.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddServiceInvoicePageRoutingModule,
  ],
  declarations: [AddServiceInvoicePage],
})
export class AddServiceInvoicePageModule {}
