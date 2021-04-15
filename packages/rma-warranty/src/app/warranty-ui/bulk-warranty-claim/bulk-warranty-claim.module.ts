import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BulkWarrantyClaimPageRoutingModule } from './bulk-warranty-claim-routing.module';

import { BulkWarrantyClaimPage } from './bulk-warranty-claim.page';
import { MaterialModule } from '../../material/material.module';
import { HttpClientModule } from '@angular/common/http';
import { AppCommonModule } from '../../common/app-common.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MaterialModule,
    HttpClientModule,
    AppCommonModule,
    BulkWarrantyClaimPageRoutingModule,
  ],
  declarations: [BulkWarrantyClaimPage],
})
export class BulkWarrantyClaimPageModule {}
