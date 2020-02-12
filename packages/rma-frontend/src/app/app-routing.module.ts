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
    path: 'warranty',
    loadChildren: './warranty-ui/warranty/warranty.module#WarrantyPageModule',
  },
  {
    path: 'sales/add-sales-invoice/:calledFrom',
    loadChildren:
      './sales-ui/add-sales-invoice/add-sales-invoice.module#AddSalesInvoicePageModule',
  },
  {
    path: 'sales/add-sales-invoice/:calledFrom/:invoiceUuid',
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
    path: 'sales/view-sales-invoice/:invoiceUuid',
    loadChildren:
      './sales-ui/view-sales-invoice/view-sales-invoice.module#ViewSalesInvoicePageModule',
  },

  {
    path: 'warranty-tabs/:calledFrom',
    loadChildren:
      './warranty-ui/warranty-tabs/warranty-tabs.module#WarrantyTabsPageModule',
  },
  {
    path: 'settings/item-price',
    loadChildren: './sales-ui/item-price/item-price.module#ItemPricePageModule',
    canActivate: [SystemManagerGuard],
  },
  {
    path: 'purchase/view-purchase-invoice/:invoiceUuid',
    loadChildren: () =>
      import(
        './purchase-ui/view-purchase-invoice/view-purchase-invoice.module'
      ).then(m => m.ViewPurchaseInvoicePageModule),
  },
  {
    path: 'sales/add-sales-return/:invoiceUuid',
    loadChildren: () =>
      import('./sales-ui/add-sales-return/add-sales-return.module').then(
        m => m.AddSalesReturnPageModule,
      ),
  },
  {
    path: 'settings/credit-limit',
    loadChildren: () =>
      import('./credit-limit/credit-limit.module').then(
        m => m.CreditLimitPageModule,
      ),
    canActivate: [SystemManagerGuard],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
  {
    path: 'warranty',
    loadChildren: () =>
      import('./warranty-ui/warranty/warranty.module').then(
        m => m.WarrantyPageModule,
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
