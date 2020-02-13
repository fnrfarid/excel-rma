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
    loadChildren: () =>
      import('./callback/callback.module').then(m => m.CallbackPageModule),
  },
  {
    path: 'sales',
    loadChildren: () =>
      import('./sales-ui/sales/sales.module').then(m => m.SalesPageModule),
  },
  {
    path: 'warranty',
    loadChildren: () =>
      import('./warranty-ui/warranty/warranty.module').then(
        m => m.WarrantyPageModule,
      ),
  },
  {
    path: 'sales/add-sales-invoice/:calledFrom',
    loadChildren: () =>
      import('./sales-ui/add-sales-invoice/add-sales-invoice.module').then(
        m => m.AddSalesInvoicePageModule,
      ),
  },
  {
    path: 'sales/add-sales-invoice/:calledFrom/:invoiceUuid',
    loadChildren: () =>
      import('./sales-ui/add-sales-invoice/add-sales-invoice.module').then(
        m => m.AddSalesInvoicePageModule,
      ),
  },
  {
    path: 'add-purchase-invoice',
    loadChildren: () =>
      import(
        './purchase-ui/add-purchase-invoice/add-purchase-invoice.module'
      ).then(m => m.AddPurchaseInvoicePageModule),
  },
  {
    path: 'purchase',
    loadChildren: () =>
      import('./purchase-ui/purchase/purchase.module').then(
        m => m.PurchasePageModule,
      ),
  },
  {
    path: 'sales/view-sales-invoice/:invoiceUuid',
    loadChildren: () =>
      import('./sales-ui/view-sales-invoice/view-sales-invoice.module').then(
        m => m.ViewSalesInvoicePageModule,
      ),
  },

  {
    path: 'warranty-tabs/:calledFrom',
    loadChildren: () =>
      import('./warranty-ui/warranty-tabs/warranty-tabs.module').then(
        m => m.WarrantyTabsPageModule,
      ),
  },
  {
    path: 'settings/item-price',
    loadChildren: () =>
      import('./sales-ui/item-price/item-price.module').then(
        m => m.ItemPricePageModule,
      ),
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
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
