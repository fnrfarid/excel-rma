import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { WarrantyTabsPageModule } from './warranty-tabs/warranty-tabs.module';
import { ViewWarrantyClaimsPageModule } from './view-warranty-claims/view-warranty-claims.module';
import { WarrantyPageModule } from './warranty/warranty.module';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MaterialModule,
    WarrantyTabsPageModule,
    ViewWarrantyClaimsPageModule,
    WarrantyPageModule,
  ],
  exports: [WarrantyTabsPageModule, ViewWarrantyClaimsPageModule],
  providers: [],
})
export class WarrantyUiModule {}
