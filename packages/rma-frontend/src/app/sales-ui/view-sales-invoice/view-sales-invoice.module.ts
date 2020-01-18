import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ViewSalesInvoicePage } from './view-sales-invoice.page';
import { DetailsComponent } from './details/details.component';
import { AccountsComponent } from './accounts/accounts.component';
import { CreditNotesComponent } from './credit-notes/credit-notes.component';
import { InvoiceWarrantyComponent } from './invoice-warranty/invoice-warranty.component';
import { SalesReturnComponent } from './sales-return/sales-return.component';
import { SerialsComponent } from './serials/serials.component';
import { MaterialModule } from '../../material/material.module';

const routes: Routes = [
  {
    path: '',
    component: ViewSalesInvoicePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MaterialModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    ViewSalesInvoicePage,
    DetailsComponent,
    AccountsComponent,
    CreditNotesComponent,
    InvoiceWarrantyComponent,
    SalesReturnComponent,
    SerialsComponent,
  ],
})
export class ViewSalesInvoicePageModule {}
