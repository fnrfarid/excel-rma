import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatPaginator, MatSort } from '@angular/material';
import { CreditLimitDataSource } from './credit-limit-datasource';
import { SalesService } from '../sales-ui/services/sales.service';

@Component({
  selector: 'app-credit-limit',
  templateUrl: './credit-limit.page.html',
  styleUrls: ['./credit-limit.page.scss'],
})
export class CreditLimitPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: CreditLimitDataSource;
  displayedColumns = [
    'customer',
    'credit_limits',
    'extended_credit_limit',
    'expiry_date',
  ];
  search: string = '';

  constructor(
    private readonly location: Location,
    private readonly salesService: SalesService,
  ) {}

  ngOnInit() {
    this.dataSource = new CreditLimitDataSource(this.salesService);
    this.dataSource.loadItems();
  }

  navigateBack() {
    this.location.back();
  }
}
