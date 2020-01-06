import { Component, OnInit } from '@angular/core';
import { SalesReturnDataSource } from './sales-return-datasource';

@Component({
  selector: 'sales-invoice-return',
  templateUrl: './sales-return.component.html',
  styleUrls: ['./sales-return.component.scss'],
})
export class SalesReturnComponent implements OnInit {
  displayedColumns = [
    'voucherNo',
    'date',
    'amount',
    'remark',
    'createdBy',
    'submittedBy',
  ];

  dataSource: SalesReturnDataSource;

  constructor() {}

  ngOnInit() {
    this.dataSource = new SalesReturnDataSource();
    this.dataSource.loadItems();
  }
}
