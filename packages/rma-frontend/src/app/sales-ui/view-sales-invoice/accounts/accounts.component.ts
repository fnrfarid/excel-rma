import { Component, OnInit, ViewChild } from '@angular/core';
import { AccountsDataSource } from './accounts-datasource';
import { WarrantyService } from '../../../warranty-ui/warranty-tabs/warranty.service';
import { MatPaginator, MatSort } from '@angular/material';

@Component({
  selector: 'sales-invoice-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export class AccountsComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  displayedColumns = [
    'name',
    'posting_date',
    'paid_amount',
    'payment_type',
    'company',
    'mode_of_payment',
    'party_type',
    'party',
    'party_balance',
    'owner',
    'modified_by',
  ];
  model: string;
  search: string = '';
  dataSource: AccountsDataSource;

  constructor(private readonly warrantyService: WarrantyService) {}

  ngOnInit() {
    this.model = 'return_voucher';
    this.dataSource = new AccountsDataSource(this.model, this.warrantyService);
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
