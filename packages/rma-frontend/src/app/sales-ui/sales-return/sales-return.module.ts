import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SalesReturnPageRoutingModule } from './sales-return-routing.module';

import { SalesReturnPage } from './sales-return.page';
import { MaterialModule } from 'src/app/material/material.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MaterialModule,
    ReactiveFormsModule,
    SalesReturnPageRoutingModule,
  ],
  declarations: [SalesReturnPage],
})
export class SalesReturnPageModule {}
