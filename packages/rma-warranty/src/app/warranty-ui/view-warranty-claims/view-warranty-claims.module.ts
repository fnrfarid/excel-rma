import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewWarrantyClaimsPageRoutingModule } from './view-warranty-claims-routing.module';

import { ViewWarrantyClaimsPage } from './view-warranty-claims.page';
import { ClaimDetailsComponent } from './claim-details/claim-details.component';
import { ServiceInvoicesComponent } from './service-invoices/service-invoices.component';
import { StatusHistoryComponent } from './status-history/status-history.component';
import { StockEntryComponent } from './stock-entry/stock-entry.component';

import { MaterialModule } from '../../material/material.module';
import { AppCommonModule } from '../../common/app-common.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MaterialModule,
    AppCommonModule,
    ReactiveFormsModule,
    ViewWarrantyClaimsPageRoutingModule,
  ],
  declarations: [
    ViewWarrantyClaimsPage,
    ClaimDetailsComponent,
    ServiceInvoicesComponent,
    StatusHistoryComponent,
    StockEntryComponent,
  ],
})
export class ViewWarrantyClaimsPageModule {}
