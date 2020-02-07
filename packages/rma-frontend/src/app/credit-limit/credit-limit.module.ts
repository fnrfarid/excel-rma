import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreditLimitPageRoutingModule } from './credit-limit-routing.module';

import { CreditLimitPage } from './credit-limit.page';
import { MaterialModule } from '../material/material.module';
import { AppCommonModule } from '../common/app-common.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreditLimitPageRoutingModule,
    MaterialModule,
    AppCommonModule,
    ReactiveFormsModule,
  ],
  declarations: [CreditLimitPage],
})
export class CreditLimitPageModule {}
