import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewPurchaseInvoicePageRoutingModule } from './view-purchase-invoice-routing.module';

import { ViewPurchaseInvoicePage } from './view-purchase-invoice.page';
import { PurchaseAssignSerialsComponent } from './purchase-assign-serials/purchase-assign-serials.component';
import { PurchaseDetailsComponent } from './purchase-details/purchase-details.component';
import { MaterialModule } from 'src/app/material/material.module';
import { AppCommonModule } from 'src/app/common/app-common.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    AppCommonModule,
    IonicModule,
    ViewPurchaseInvoicePageRoutingModule,
  ],
  declarations: [
    ViewPurchaseInvoicePage,
    PurchaseAssignSerialsComponent,
    PurchaseDetailsComponent,
  ],
})
export class ViewPurchaseInvoicePageModule {}
