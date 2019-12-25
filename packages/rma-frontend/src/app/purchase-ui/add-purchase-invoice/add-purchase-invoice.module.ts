import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AddPurchaseInvoicePage } from './add-purchase-invoice.page';

const routes: Routes = [
  {
    path: '',
    component: AddPurchaseInvoicePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [AddPurchaseInvoicePage]
})
export class AddPurchaseInvoicePageModule {}
