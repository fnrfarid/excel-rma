import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { ItemPriceDataSource, ListingData } from './item-price.datasource';
import { ItemPriceService } from '../services/item-price.service';
import { SalesService } from '../services/sales.service';

@Component({
  selector: 'app-item-price',
  templateUrl: './item-price.page.html',
  styleUrls: ['./item-price.page.scss'],
})
export class ItemPricePage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource: ItemPriceDataSource;
  displayedColumns = [
    'name',
    'item_name',
    'brand',
    'purchaseWarrantyDays',
    'selling_price',
    'price',
  ];
  itemName: string = '';
  brand: string = '';
  itemGroup: string = '';
  purchaseWarrantyDays: string = '';
  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly itemPriceService: ItemPriceService,
    private readonly salesService: SalesService,
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

  setFilter(event?: Sort) {
    const query: any = {};
    if (this.brand) query.brand = this.brand;
    if (this.itemGroup) query.item_group = this.itemGroup;
    if (this.itemName) query.item_name = this.itemName;

    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    this.dataSource.loadItems(
      query,
      sortQuery,
      this.paginator.pageIndex,
      this.paginator.pageSize,
    );
  }

  updatePurchaseWarrantyDays(row: ListingData, days: number) {
    this.itemPriceService.setPurchaseWarrantyDays(row.uuid, days).subscribe({
      next: success => (row.purchaseWarrantyDays = days),
      error: error => {},
    });
  }

  updateMinPrice(row: ListingData, minPrice: number) {
    this.itemPriceService.setMinPrice(row.uuid, minPrice).subscribe({
      next: success => (row.minimumPrice = minPrice),
      error: error => {},
    });
  }

  getUpdate(event) {
    this.dataSource.loadItems(
      {
        brand: this.brand,
        item_group: this.itemGroup,
        item_name: this.itemName,
      },
      this.sort.direction,
      event.pageIndex,
      event.pageSize,
    );
  }

  loadPrice(row, index) {
    const data = this.dataSource.getData();
    if (data.length !== 1) {
      data[index] = { ...row };
      this.salesService
        .getItemPrice(data[index].name)
        .pipe(map(prices => (prices.length ? prices[0].price_list_rate : 0)))
        .subscribe({
          next: price => {
            data[index].selling_price = price;
          },
        });
    }
    this.dataSource.update(data);
  }
}
