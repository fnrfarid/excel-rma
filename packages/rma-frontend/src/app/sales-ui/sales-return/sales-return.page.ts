import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { SalesReturnListDataSource } from './sales-return-list.datasource';
import { SalesReturnService } from '../view-sales-invoice/sales-return/sales-return.service';
import { FormControl } from '@angular/forms';
import { SalesService } from '../services/sales.service';

@Component({
  selector: 'app-sales-return',
  templateUrl: './sales-return.page.html',
  styleUrls: ['./sales-return.page.scss'],
})
export class SalesReturnPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  fromDateFormControl = new FormControl();
  toDateFormControl = new FormControl();
  name: string = '';
  status: string = '';
  statusList = ['Draft', 'To Bill', 'Completed'];
  total = 0;
  customer: string = '';
  dataSource: SalesReturnListDataSource;
  displayedColumns = [
    'name',
    'posting_date',
    'title',
    'total',
    'status',
    'owner',
    'modified_by',
  ];
  filters: any = [['is_return', '=', '1']];
  countFilter: any = { is_return: ['=', '1'] };
  constructor(
    private readonly salesReturnService: SalesReturnService,
    private readonly salesService: SalesService,
  ) {}

  ngOnInit() {
    this.dataSource = new SalesReturnListDataSource(
      this.salesReturnService,
      this.salesService,
    );
    this.dataSource.loadItems(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.filters,
      this.countFilter,
    );
    this.dataSource.totalSubject.subscribe({
      next: total => {
        this.total = total;
      },
    });
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      event.pageIndex,
      event.pageSize,
      this.filters,
      this.countFilter,
    );
  }

  setFilter() {
    this.filters = [];
    this.countFilter = {};
    this.filters.push(['is_return', '=', '1']);
    this.countFilter.is_return = ['=', '1'];
    if (this.customer) {
      this.filters.push(['customer', 'like', `%${this.customer}%`]);
      this.countFilter.customer = ['like', `%${this.customer}%`];
    }
    if (this.name) {
      this.filters.push(['name', 'like', `%${this.name}%`]);
      this.countFilter.name = ['like', `%${this.name}%`];
    }

    if (this.status) {
      this.filters.push(['status', '=', this.status]);
      this.countFilter.status = ['=', this.status];
    }

    if (this.fromDateFormControl.value && this.toDateFormControl.value) {
      const fromDate = this.getParsedDate(this.fromDateFormControl.value);
      const toDate = this.getParsedDate(this.toDateFormControl.value);
      this.filters.push(['creation', 'Between', [fromDate, toDate]]);
      this.countFilter.creation = ['Between', `${fromDate} ${toDate}`];
    }

    this.dataSource.loadItems(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.filters,
      this.countFilter,
    );
  }

  dateFilter() {
    if (this.fromDateFormControl.value && this.toDateFormControl.value)
      this.setFilter();
  }

  getParsedDate(value) {
    const date = new Date(value);
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      // +1 as index of months start's from 0
      date.getDate(),
    ].join('-');
  }

  clearFilters() {
    this.status = '';
    this.name = '';
    this.customer = '';
    this.fromDateFormControl.setValue('');
    this.toDateFormControl.setValue('');
    this.setFilter();
  }
}
