import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { WarrantyPageRoutingModule } from './warranty-routing.module';
import { WarrantyPage } from './warranty.page';
import { MaterialModule } from '../../material/material.module';
import { HttpClientModule } from '@angular/common/http';
import { WarrantyService } from '../warranty-tabs/warranty.service';
import { AppCommonModule } from '../../common/app-common.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WarrantyPageRoutingModule,
    MaterialModule,
    HttpClientModule,

    AppCommonModule,
  ],
  declarations: [WarrantyPage],
  providers: [WarrantyService],
})
export class WarrantyPageModule {}
