import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SystemManagerGuard } from './common/guards/system-manager.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./settings/settings.module').then(m => m.SettingsPageModule),
    canActivate: [SystemManagerGuard],
  },
  {
    path: 'callback',
    loadChildren: () =>
      import('./callback/callback.module').then(m => m.CallbackPageModule),
  },
  {
    path: 'callback',
    loadChildren: './callback/callback.module#CallbackPageModule',
  },
  {
    path: 'sales',
    loadChildren: './sales-ui/sales/sales.module#SalesPageModule',
  },
  {
    path: 'add-sales-invoice/:calledFrom',
    loadChildren:
      './sales-ui/add-sales-invoice/add-sales-invoice.module#AddSalesInvoicePageModule',
  },
  {
    path: 'add-purchase-invoice',
    loadChildren:
      './purchase-ui/add-purchase-invoice/add-purchase-invoice.module#AddPurchaseInvoicePageModule',
  },
  {
    path: 'purchase',
    loadChildren: './purchase-ui/purchase/purchase.module#PurchasePageModule',
  },
  {
    path: 'view-sales-invoice/:invoiceUuid',
    loadChildren:
      './sales-ui/view-sales-invoice/view-sales-invoice.module#ViewSalesInvoicePageModule',
  },
  {
    path: 'warranty',
    loadChildren:
      './warranty-ui/warranty-tabs/warranty-tabs.module#WarrantyTabsPageModule',
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
