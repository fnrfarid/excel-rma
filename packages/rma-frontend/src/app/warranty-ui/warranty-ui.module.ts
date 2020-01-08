import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { WarrantyTabsPageModule } from './warranty-tabs/warranty-tabs.module';
// import { WarrantyService } from './warranty/warranty.service';

@NgModule({
  declarations: [],
  imports: [CommonModule, MaterialModule, WarrantyTabsPageModule],
  exports: [WarrantyTabsPageModule],
  providers: [],
})
export class SalesUiModule {}
