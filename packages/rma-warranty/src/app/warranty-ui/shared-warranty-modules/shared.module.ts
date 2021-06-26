import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceInvoicesComponent } from './service-invoices/service-invoices.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AppCommonModule } from 'src/app/common/app-common.module';
import { MaterialModule } from 'src/app/material/material.module';
import { RouterModule } from '@angular/router';
import { PrintSettingDialog } from './print-setting-dialog/print-setting-dialog';

@NgModule({
  declarations: [ServiceInvoicesComponent, PrintSettingDialog],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MaterialModule,
    HttpClientModule,
    AppCommonModule,
    RouterModule,
  ],
  exports: [ServiceInvoicesComponent, PrintSettingDialog],
})
export class SharedModule {}
