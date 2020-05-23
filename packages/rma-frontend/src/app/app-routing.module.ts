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
    path: 'stock-entry',
    loadChildren: () =>
      import('./stock-entry/stock-entry-list/stock-entry-list.module').then(
        m => m.StockEntryListModule,
      ),
  },
  {
    path: 'material-transfer',
    loadChildren: () =>
      import('./stock-entry/stock-entry.module').then(m => m.StockEntryModule),
  },
  {
    path: 'material-transfer/:uuid',
    loadChildren: () =>
      import('./stock-entry/stock-entry.module').then(m => m.StockEntryModule),
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
    path: 'warranty/add-warranty-claim/:uuid',
    loadChildren: () =>
      import('./warranty-ui/add-warranty-claim/add-warranty-claim.module').then(
        m => m.AddWarrantyClaimPageModule,
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
    path: 'warranty/view-warranty-claims/:uuid',
    loadChildren: () =>
      import(
        './warranty-ui/view-warranty-claims/view-warranty-claims.module'
      ).then(m => m.ViewWarrantyClaimsPageModule),
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
  {
    path: 'add-warranty-claim',
    loadChildren: () =>
      import('./warranty-ui/add-warranty-claim/add-warranty-claim.module').then(
        m => m.AddWarrantyClaimPageModule,
      ),
  },
  {
    path: 'settings/problem',
    loadChildren: () =>
      import('./problem-ui/problem/problem.module').then(
        m => m.ProblemPageModule,
      ),
  },
  {
    path: 'jobs',
    loadChildren: () =>
      import('./job-ui/jobs/jobs.module').then(m => m.JobsPageModule),
  },
  {
    path: 'view-single-job',
    loadChildren: () =>
      import('./job-ui/view-single-job/view-single-job.module').then(
        m => m.ViewSingleJobPageModule,
      ),
  },
  {
    path: 'sales-return',
    loadChildren: () =>
      import('./sales-ui/sales-return/sales-return.module').then(
        m => m.SalesReturnPageModule,
      ),
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
