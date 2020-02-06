import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { WarrantyTabsPageModule } from './warranty-tabs/warranty-tabs.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, MaterialModule, WarrantyTabsPageModule],
  exports: [WarrantyTabsPageModule],
  providers: [],
})
export class WarrantyUiModule {}
