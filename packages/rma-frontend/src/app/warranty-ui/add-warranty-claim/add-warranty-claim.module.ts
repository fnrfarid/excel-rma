import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddWarrantyClaimPageRoutingModule } from './add-warranty-claim-routing.module';

import { AddWarrantyClaimPage } from './add-warranty-claim.page';
import { MaterialModule } from '../../material/material.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddWarrantyClaimPageRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
  ],
  declarations: [AddWarrantyClaimPage],
})
export class AddWarrantyClaimPageModule {}
