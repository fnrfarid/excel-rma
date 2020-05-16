import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { SalesReturnListDataSource } from './sales-return-list.datasource';
import { SalesReturnService } from '../view-sales-invoice/sales-return/sales-return.service';

@Component({
  selector: 'app-sales-return',
  templateUrl: './sales-return.page.html',
  styleUrls: ['./sales-return.page.scss'],
})
export class SalesReturnPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

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
  constructor(private readonly salesReturnService: SalesReturnService) {}

  ngOnInit() {
    this.dataSource = new SalesReturnListDataSource(this.salesReturnService);
    this.dataSource.loadItems();
  }

  getUpdate(event) {
    this.dataSource.loadItems(event.pageIndex, event.pageSize);
  }
}
