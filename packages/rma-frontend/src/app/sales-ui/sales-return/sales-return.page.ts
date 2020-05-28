import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { SalesReturnListDataSource } from './sales-return-list.datasource';
import { SalesReturnService } from '../view-sales-invoice/sales-return/sales-return.service';
import { FormControl } from '@angular/forms';

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
  constructor(private readonly salesReturnService: SalesReturnService) {}

  ngOnInit() {
    this.dataSource = new SalesReturnListDataSource(this.salesReturnService);
    this.dataSource.loadItems(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.filters,
    );
  }

  getUpdate(event) {
    this.dataSource.loadItems(event.pageIndex, event.pageSize, this.filters);
  }

  setFilter() {
    this.filters = [];
    this.filters.push(['is_return', '=', '1']);
    if (this.customer)
      this.filters.push(['customer', 'like', `%${this.customer}%`]);
    if (this.name) this.filters.push(['name', 'like', `%${this.name}%`]);

    if (this.fromDateFormControl.value && this.toDateFormControl.value) {
      const fromDate = this.getParsedDate(this.fromDateFormControl.value);
      const toDate = this.getParsedDate(this.toDateFormControl.value);
      this.filters.push(['creation', 'Between', [fromDate, toDate]]);
    }

    this.dataSource.loadItems(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.filters,
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
}
