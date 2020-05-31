import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { CustomerDataSource } from './customer-datasource';
import { SalesService } from '../sales-ui/services/sales.service';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile.page.html',
  styleUrls: ['./customer-profile.page.scss'],
})
export class CustomerProfilePage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  dataSource: CustomerDataSource;
  displayedColumns = ['customer'];
  search: string = '';
  filters: any = [];
  countFilter: any = {};
  constructor(
    private readonly location: Location,
    private readonly salesService: SalesService,
  ) {}

  ngOnInit() {
    this.dataSource = new CustomerDataSource(this.salesService);
    this.dataSource.loadItems(0, 10, this.filters, this.countFilter);
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

    if (this.search) {
      this.filters.push(['name', 'like', `%${this.search}%`]);
      this.countFilter.name = ['like', `%${this.search}%`];
    }

    this.dataSource.loadItems(
      this.paginator.pageIndex,
      this.paginator.pageSize,
      this.filters,
      this.countFilter,
    );
  }

  navigateBack() {
    this.location.back();
  }
}
