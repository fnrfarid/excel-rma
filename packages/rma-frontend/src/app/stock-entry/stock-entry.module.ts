import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { MaterialTransferComponent } from './material-transfer/material-transfer.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AppCommonModule } from '../common/app-common.module';

@NgModule({
  declarations: [MaterialTransferComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MaterialModule,
    AppCommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: MaterialTransferComponent,
      },
    ]),
  ],
  exports: [],
  providers: [],
})
export class StockEntryModule {}
