import { Component, OnInit } from '@angular/core';
import { AccountsDataSource } from './accounts-datasource';

@Component({
  selector: 'sales-invoice-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export class AccountsComponent implements OnInit {
  displayedColumns = [
    'voucher-no',
    'voucher-type',
    'amount',
    'dated',
    'remark',
  ];

  dataSource: AccountsDataSource;

  constructor() {}

  ngOnInit() {
    this.dataSource = new AccountsDataSource();
    this.dataSource.loadItems();
  }
}
