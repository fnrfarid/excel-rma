import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SerialInfoPageRoutingModule } from './serial-info-routing.module';

import { SerialInfoPage } from './serial-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SerialInfoPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [SerialInfoPage],
})
export class SerialInfoPageModule {}
