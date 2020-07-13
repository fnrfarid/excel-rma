import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddStockEntryPageRoutingModule } from './add-stock-entry-routing.module';

import { AddStockEntryPage } from './add-stock-entry.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddStockEntryPageRoutingModule,
  ],
  declarations: [AddStockEntryPage],
})
export class AddStockEntryPageModule {}
