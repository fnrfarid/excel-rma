import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ItemPricePage } from './item-price.page';
import { MaterialModule } from '../../material/material.module';
import { AppCommonModule } from '../../common/app-common.module';
import { EditPriceComponent } from './edit-price/edit-price.component';
import { EditDaysComponent } from './edit-days/edit-days.component';
const routes: Routes = [
  {
    path: '',
    component: ItemPricePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    MaterialModule,
    AppCommonModule,
  ],
  declarations: [ItemPricePage, EditPriceComponent, EditDaysComponent],
})
export class ItemPricePageModule {}
