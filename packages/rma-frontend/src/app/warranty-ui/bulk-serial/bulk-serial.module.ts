import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { BulkSerialPage } from './bulk-serial.page';
import { MaterialModule } from '../../material/material.module';

const routes: Routes = [
  {
    path: '',
    component: BulkSerialPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MaterialModule,
    RouterModule.forChild(routes),
  ],
  declarations: [BulkSerialPage],
})
export class BulkSerialPageModule {}
