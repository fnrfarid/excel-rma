import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AddSalesInvoicePage } from './add-sales-invoice.page';
import { MaterialModule } from '../../material/material.module';
import { InlineEditComponent } from './inline-edit/inline-edit.component';
import { KeyDownDetectorDirective } from './on-key-down-directive';
import { AppCommonModule } from '../../common/app-common.module';
import { CustomerCreateDialogComponent } from './customer-create-dialog/customer-create-dialog.component';
import { DraftListComponent } from './draft-list/draft-list.component';

const routes: Routes = [
  {
    path: '',
    component: AddSalesInvoicePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AppCommonModule,
    IonicModule,
    RouterModule.forChild(routes),
    MaterialModule,
    ReactiveFormsModule,
  ],
  declarations: [
    AddSalesInvoicePage,
    InlineEditComponent,
    KeyDownDetectorDirective,
    CustomerCreateDialogComponent,
    DraftListComponent
  ],
  exports: [InlineEditComponent, KeyDownDetectorDirective,CustomerCreateDialogComponent, DraftListComponent],
})
export class AddSalesInvoicePageModule {}