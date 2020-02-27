import { Component, OnInit, ViewChild } from '@angular/core';
import { SalesService } from '../services/sales.service';
import { SalesInvoice } from '../../common/interfaces/sales.interface';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SalesInvoiceDataSource } from './sales-invoice-datasource';
import { SettingsService } from '../../settings/settings.service';
import { SYSTEM_MANAGER } from '../../constants/app-string';
import { Router, NavigationEnd } from '@angular/router';
import {
  VIEW_SALES_INVOICE_PAGE_URL,
  ADD_SALES_INVOICE_PAGE_URL,
} from '../../constants/url-strings';
import { map, filter } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

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
  displayedColumns = [
    'name',
    'status',
    'posting_date',
    'customer',
    'total',
    'remarks',
    'territory',
    'created_by',
    'delivered_by',
  ];
  invoiceStatus: string[] = [
    'Draft',
    'Completed',
    'To Deliver',
    'Canceled',
    'Rejected',
    'Submitted',
    'All',
  ];
  campaignStatus: string[] = ['Yes', 'No', 'All'];
  customer: string = '';
  status: string = 'All';
  name: string = '';
  branch: string = '';
  total: number = 0;
  campaign: string = 'All';
  fromDateFormControl = new FormControl();
  toDateFormControl = new FormControl();

  constructor(
    private readonly salesService: SalesService,
    private location: Location,
    private readonly settingService: SettingsService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.dataSource = new SalesInvoiceDataSource(this.salesService);
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => {
          this.dataSource.loadItems(undefined, undefined, undefined, {
            status: this.status,
          });
          return event;
        }),
      )
      .subscribe({
        next: res => {
          this.getTotal();
        },
        error: err => {},
      });
  }

  getTotal() {
    this.dataSource.total.subscribe({
      next: total => {
        this.total = total;
      },
    });
  }

  getUpdate(event) {
    const query: any = {};
    if (this.customer) query.customer = this.customer;
    if (this.status) query.status = this.status;
    if (this.name) query.name = this.name;
    if (this.campaign) {
      if (this.campaign === 'Yes') {
        query.isCampaign = true;
      } else if (this.campaign === 'No') {
        query.isCampaign = false;
      }
    }
    if (this.branch) query.territory = this.branch;
    this.dataSource.loadItems(
      undefined,
      event.pageIndex,
      event.pageSize,
      query,
    );
  }

  dateFilter() {
    if (this.fromDateFormControl.value && this.toDateFormControl.value)
      this.setFilter();
  }

  clearFilters() {
    this.customer = '';
    this.status = 'All';
    this.name = '';
    this.branch = '';
    this.campaign = 'All';
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.dataSource.loadItems();
  }

  setFilter(event?) {
    const query: any = {};
    if (this.customer) query.customer = this.customer;
    if (this.status) query.status = this.status;
    if (this.name) query.name = this.name;
    if (this.branch) query.territory = this.branch;
    if (this.campaign) {
      if (this.campaign === 'Yes') {
        query.isCampaign = true;
      } else if (this.campaign === 'No') {
        query.isCampaign = false;
      }
    }
    if (this.fromDateFormControl.value && this.toDateFormControl.value) {
      query.fromDate = new Date().setDate(
        this.fromDateFormControl.value.getDate(),
      );
      query.toDate = new Date().setDate(this.toDateFormControl.value.getDate());
    }
    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    this.dataSource.loadItems(
      sortQuery,
      this.paginator.pageIndex,
      this.paginator.pageSize,
      query,
    );
  }

  navigateBasedOnRoles(row) {
    this.settingService.checkUserProfile().subscribe({
      next: res => {
        let navUrl: string;
        if (res && res.roles.length > 0 && res.roles.includes(SYSTEM_MANAGER)) {
          navUrl = `/sales/${VIEW_SALES_INVOICE_PAGE_URL}/${row.uuid}`;
          this.router.navigateByUrl(navUrl);
        } else {
          navUrl = `/sales/${ADD_SALES_INVOICE_PAGE_URL}/edit/${row.uuid}`;
          this.router.navigateByUrl(navUrl);
        }
      },
    });
  }

  navigateBack() {
    this.location.back();
  }

  statusChange(status) {
    if (status === 'All') {
      this.dataSource.loadItems();
    } else {
      this.status = status;
      this.setFilter();
    }
  }

  getDate(date: string) {
    return new Date(date);
  }

  statusOfCampaignChange(campaign) {
    if (campaign === 'All') {
      this.dataSource.loadItems();
    } else {
      this.campaign = campaign;
      this.setFilter();
    }
  }
}
