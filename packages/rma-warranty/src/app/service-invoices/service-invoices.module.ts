import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ServiceInvoicesPageRoutingModule } from './service-invoices-routing.module';
import { MaterialModule } from 'src/app/material/material.module';

import { ServiceInvoicesPage } from './service-invoices.page';
import { AppCommonModule } from '../common/app-common.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ServiceInvoicesPageRoutingModule,
    MaterialModule,
    AppCommonModule,
  ],
  declarations: [ServiceInvoicesPage]
})
export class ServiceInvoicesPageModule {}
