import { Component, OnInit, ViewChild } from '@angular/core';
import { PurchaseService } from '../services/purchase.service';
import { PurchaseInvoiceDataSource } from './purchase-invoice-datasource';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { PurchaseInvoice } from '../../common/interfaces/purchase.interface';
import { Location } from '@angular/common';
import { FormControl } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../constants/date-format';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.page.html',
  styleUrls: ['./purchase.page.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class PurchasePage implements OnInit {
  salesInvoiceList: Array<PurchaseInvoice>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: PurchaseInvoiceDataSource;
  displayedColumns = [
    'sr_no',
    'purchase_invoice_number',
    'status',
    'date',
    'supplier',
    'total',
    'created_by',
    'delivered_by',
  ];
  invoiceStatus: string[] = ['Completed', 'Canceled', 'Submitted', 'All'];
  supplier: string = '';
  status: string = 'All';
  name: string = '';
  search: string = '';
  total: number = 0;
  fromDateFormControl = new FormControl();
  toDateFormControl = new FormControl();
  singleDateFormControl = new FormControl();
  constructor(
    private location: Location,
    private readonly purchaseService: PurchaseService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.dataSource = new PurchaseInvoiceDataSource(this.purchaseService);
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => {
          this.dataSource.loadItems(undefined, undefined, undefined, {});
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

  getUpdate(event) {
    const query: any = {};
    if (this.supplier) query.supplier_name = this.supplier;
    if (this.status) query.status = this.status;
    if (this.name) query.name = this.name;
    if (this.singleDateFormControl.value) {
      query.fromDate = new Date(this.singleDateFormControl.value).setHours(
        0,
        0,
        0,
        0,
      );
      query.toDate = new Date(this.singleDateFormControl.value).setHours(
        23,
        59,
        59,
        59,
      );
    }
    if (this.fromDateFormControl.value && this.toDateFormControl.value) {
      query.fromDate = new Date(this.fromDateFormControl.value).setHours(
        0,
        0,
        0,
        0,
      );
      query.toDate = new Date(this.toDateFormControl.value).setHours(
        23,
        59,
        59,
        59,
      );
    }
    this.dataSource.loadItems(
      undefined,
      event.pageIndex,
      event.pageSize,
      query,
    );
  }

  getTotal() {
    this.dataSource.total.subscribe({
      next: total => {
        this.total = total;
      },
    });
  }

  dateFilter() {
    this.singleDateFormControl.setValue('');
    this.setFilter();
  }

  setFilter(event?) {
    const query: any = {};
    if (this.supplier) query.supplier_name = this.supplier;
    if (this.status) query.status = this.status;
    if (this.name) query.name = this.name;
    if (this.fromDateFormControl.value && this.toDateFormControl.value) {
      query.fromDate = new Date(this.fromDateFormControl.value).setHours(
        0,
        0,
        0,
        0,
      );
      query.toDate = new Date(this.toDateFormControl.value).setHours(
        23,
        59,
        59,
        59,
      );
    }
    if (this.singleDateFormControl.value) {
      query.fromDate = new Date(this.singleDateFormControl.value).setHours(
        0,
        0,
        0,
        0,
      );
      query.toDate = new Date(this.singleDateFormControl.value).setHours(
        23,
        59,
        59,
        59,
      );
    }
    let sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    sortQuery =
      Object.keys(sortQuery).length === 0 ? { created_on: 'DESC' } : sortQuery;

    this.dataSource.loadItems(
      sortQuery,
      this.paginator.pageIndex,
      this.paginator.pageSize,
      query,
    );
  }

  statusChange(status) {
    if (status === 'All') {
      this.dataSource.loadItems();
    } else {
      this.status = status;
      this.setFilter();
    }
  }

  singleDateFilter() {
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.setFilter();
  }

  clearFilters() {
    this.supplier = '';
    this.name = '';
    this.status = 'All';
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.singleDateFormControl.setValue('');
    this.dataSource.loadItems();
  }

  navigateBack() {
    this.location.back();
  }
}
