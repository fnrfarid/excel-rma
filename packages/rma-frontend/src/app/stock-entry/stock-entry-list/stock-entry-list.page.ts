import { Component, OnInit, ViewChild } from '@angular/core';
import {
  StockEntryListDataSource,
  StockEntryListData,
} from './stock-entry-list-datasource';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../constants/date-format';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';
import { FormControl } from '@angular/forms';
import { STOCK_TRANSFER_STATUS } from 'src/app/constants/app-string';
import { PERMISSION_STATE } from 'src/app/constants/permission-roles';

@Component({
  selector: 'app-stock-entry-list',
  templateUrl: './stock-entry-list.page.html',
  styleUrls: ['./stock-entry-list.page.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class StockEntryListPage implements OnInit {
  salesInvoiceList: Array<StockEntryListData>;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: StockEntryListDataSource;
  displayedColumns = [
    'sr_no',
    'name',
    's_warehouse',
    't_warehouse',
    'status',
    'createdBy',
    'remarks',
    'territory',
    'posting_date',
    'posting_time',
  ];
  warehouses = [];
  fromDateFormControl = new FormControl();
  toDateFormControl = new FormControl();
  singleDateFormControl = new FormControl();
  filterState: any = {};
  permissionState = PERMISSION_STATE;
  invoiceStatus: string[] = Object.keys(STOCK_TRANSFER_STATUS).map(
    key => STOCK_TRANSFER_STATUS[key],
  );
  search: string = '';
  constructor(
    private location: Location,
    private readonly stockEntryService: StockEntryService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(() => {
      this.paginator.firstPage();
    });
    this.dataSource = new StockEntryListDataSource(this.stockEntryService);
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => {
          this.dataSource.loadItems(undefined, undefined, undefined, {});
          return event;
        }),
      )
      .subscribe({
        next: res => {},
        error: err => {},
      });

    this.getWarehouses();
  }

  statusChange(status) {
    if (status === 'All') {
      delete this.filterState.status;
      this.dataSource.loadItems();
    } else {
      this.filterState.status = status;
      this.setFilter();
    }
  }

  dateFilter() {
    this.singleDateFormControl.setValue('');
    this.setFilter();
  }

  getUpdate(event) {
    const query: any = this.filterState;
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
    if (this.search) query.search = this.search;
    this.dataSource.loadItems(
      undefined,
      event.pageIndex,
      event.pageSize,
      query,
    );
  }

  fromWarehouseChange(value) {
    this.filterState.s_warehouse = value.name;
    this.setFilter();
  }

  toWarehouseChange(value) {
    this.filterState.t_warehouse = value.name;
    this.setFilter();
  }

  singleDateFilter() {
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.setFilter();
  }

  clearFilters() {
    this.filterState = {};
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.singleDateFormControl.setValue('');
    this.dataSource.loadItems();
  }

  setFilter(event?) {
    const query: any = this.filterState;
    let sortQuery = {};

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

    sortQuery = { _id: -1 };

    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
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

  navigateBack() {
    this.location.back();
  }

  getWarehouses() {
    this.stockEntryService.getWarehouseList().subscribe({
      next: res => {
        this.warehouses = res;
      },
    });
  }

  getOption(option) {
    if (option) return option.name;
  }
}
