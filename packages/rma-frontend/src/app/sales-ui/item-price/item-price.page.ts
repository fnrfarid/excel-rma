import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatPaginator, MatSort } from '@angular/material';
import { Router, NavigationEnd } from '@angular/router';
import { ItemPriceDataSource, ListingData } from './item-price.datasource';
import { ItemPriceService } from '../services/item-price.service';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-item-price',
  templateUrl: './item-price.page.html',
  styleUrls: ['./item-price.page.scss'],
})
export class ItemPricePage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: ItemPriceDataSource;
  displayedColumns = ['item', 'price'];
  search: string = '';

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly itemPriceService: ItemPriceService,
  ) {}

  ngOnInit() {
    this.dataSource = new ItemPriceDataSource(this.itemPriceService);
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => {
          this.dataSource.loadItems();
          return event;
        }),
      )
      .subscribe({ next: res => {}, error: err => {} });
  }

  navigateBack() {
    this.location.back();
  }

  setFilter() {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize,
    );
  }

  updateMinPrice(row: ListingData, minPrice: number) {
    this.itemPriceService.setMinPrice(row.uuid, minPrice).subscribe({
      next: success => (row.minimumPrice = minPrice),
      error: error => {},
    });
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      this.search,
      this.sort.direction,
      event.pageIndex,
      event.pageSize,
    );
  }
}
