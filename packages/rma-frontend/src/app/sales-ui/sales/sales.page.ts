import { Component, OnInit, ViewChild } from '@angular/core';
import { SalesService } from '../services/sales.service';
import { SalesInvoice } from '../../common/interfaces/sales.interface';
import { Location } from '@angular/common';
import { MatPaginator, MatSort } from '@angular/material';
import { SalesInvoiceDataSource } from './sales-invoice-datasource';
import { SettingsService } from '../../settings/settings.service';
import { SYSTEM_MANAGER } from '../../constants/app-string';
import { Router, NavigationExtras } from '@angular/router';
import {
  VIEW_SALES_INVOICE_PAGE_URL,
  ADD_SALES_INVOICE_PAGE_URL,
} from '../../constants/url-strings';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.page.html',
  styleUrls: ['./sales.page.scss'],
})
export class SalesPage implements OnInit {
  salesInvoiceList: Array<SalesInvoice>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: SalesInvoiceDataSource;
  displayedColumns = ['customer', 'status', 'total'];
  search: string = '';
  constructor(
    private readonly salesService: SalesService,
    private location: Location,
    private readonly settingService: SettingsService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.dataSource = new SalesInvoiceDataSource(this.salesService);
    this.dataSource.loadItems();
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      event.pageIndex,
      event.pageSize,
    );
  }

  setFilter() {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize,
    );
  }

  navigateBasedOnRoles(row) {
    this.settingService.checkUserProfile().subscribe({
      next: res => {
        let navUrl: string;
        if (res && res.roles.length > 0 && res.roles.includes(SYSTEM_MANAGER)) {
          const navExtras: NavigationExtras = {
            state: {
              sales_invoice_name: row.name,
            },
          };
          navUrl = `${VIEW_SALES_INVOICE_PAGE_URL}/${row.uuid}`;
          this.router.navigateByUrl(navUrl, navExtras);
        } else {
          navUrl = `${ADD_SALES_INVOICE_PAGE_URL}/edit/${row.uuid}`;
          this.router.navigateByUrl(navUrl);
        }
      },
    });
  }

  navigateBack() {
    this.location.back();
  }
}
