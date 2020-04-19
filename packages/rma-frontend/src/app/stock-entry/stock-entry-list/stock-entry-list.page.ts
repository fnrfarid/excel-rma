import { Component, OnInit, ViewChild } from '@angular/core';
import {
  StockEntryListDataSource,
  StockEntryListData,
} from './stock-entry-list-datasource';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../constants/date-format';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';

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
    'createdByEmail',
    'createdBy',
    'transferWarehouse',
    'company',
    'posting_date',
    'posting_time',
  ];
  invoiceStatus: string[] = ['Completed', 'Canceled', 'Submitted', 'All'];
  search: string = '';
  constructor(
    private location: Location,
    private readonly stockEntryService: StockEntryService,
    private router: Router,
  ) {}

  ngOnInit() {
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
  }

  getUpdate(event) {
    const query: any = {};
    if (this.search) query.search = this.search;
    this.dataSource.loadItems(
      undefined,
      event.pageIndex,
      event.pageSize,
      query,
    );
  }

  setFilter(event?) {
    const query: any = {};
    if (this.search) query.search = this.search;
    let sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    sortQuery = { created_on: 'DESC' };

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
}
