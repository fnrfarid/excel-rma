import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';
import { AssignSerialComponent } from './assign-serial.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AppCommonModule } from '../common/app-common.module';

@NgModule({
  declarations: [AssignSerialComponent],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    IonicModule,
    AppCommonModule,
    FormsModule,
  ],
  providers: [],
  exports: [AssignSerialComponent],
})
export class AssignSerialModule {}
