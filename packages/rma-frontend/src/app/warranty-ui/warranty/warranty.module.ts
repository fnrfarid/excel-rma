import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WarrantyPageRoutingModule } from './warranty-routing.module';

import { WarrantyPage } from './warranty.page';
import { MaterialModule } from 'src/app/material/material.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WarrantyPageRoutingModule,
    MaterialModule,
  ],
  declarations: [WarrantyPage],
})
export class WarrantyPageModule {}
