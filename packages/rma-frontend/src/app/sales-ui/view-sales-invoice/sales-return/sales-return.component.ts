import { Component, OnInit, ViewChild } from '@angular/core';
import { WarrantyService } from '../../../warranty-ui/warranty-tabs/warranty.service';
import { SalesReturnDataSource } from './sales-return.datasource';
import { MatPaginator, MatSort } from '@angular/material';

@Component({
  selector: 'sales-invoice-return',
  templateUrl: './sales-return.component.html',
  styleUrls: ['./sales-return.component.scss'],
})
export class SalesReturnComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource: SalesReturnDataSource;
  displayedColumns = [
    'name',
    'posting_date',
    'title',
    'total',
    'status',
    'owner',
    'modified_by',
  ];
  model: string;
  search: string = '';

  constructor(private readonly warrantyService: WarrantyService) {}

  ngOnInit() {
    this.model = 'delivery_note';
    this.dataSource = new SalesReturnDataSource(
      this.model,
      this.warrantyService,
    );
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
}
