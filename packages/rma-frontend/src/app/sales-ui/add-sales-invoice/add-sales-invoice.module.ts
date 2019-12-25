import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { AddSalesInvoicePage } from './add-sales-invoice.page';

const routes: Routes = [
  {
    path: '',
    component: AddSalesInvoicePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AddSalesInvoicePage],
})
export class AddSalesInvoicePageModule {}
