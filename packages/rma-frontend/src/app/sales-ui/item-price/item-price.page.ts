import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { ItemPriceDataSource, ListingData } from './item-price.datasource';
import { ItemPriceService } from '../services/item-price.service';
import { SalesService } from '../services/sales.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CLOSE } from '../../constants/app-string';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

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
    'has_serial',
    'purchaseWarrantyMonths',
    'salesWarrantyMonths',
    'price',
    'selling_price',
  ];
  itemName: string = '';
  brand: string = '';
  itemGroup: string = '';
  purchaseWarrantyMonths: string = '';
  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly itemPriceService: ItemPriceService,
    private readonly salesService: SalesService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(() => {
      this.paginator.firstPage();
    });
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

  async itemSerialized(event, item_name) {
    event = event ? 1 : 0;
    const message = `Reset the serial to be ${
      event ? 'Serialized' : 'Non Serialized'
    }`;
    const dialog = this.dialog.open(ConfirmationDialog, {
      data: { event: message },
    });
    const response = await dialog.afterClosed().toPromise();

    if (!response) {
      this.updateSerialized(item_name, event);
      return;
    }

    return this.itemPriceService.updateHasSerialNo(event, item_name).subscribe({
      next: success => {
        this.snackBar.open('Item updated.', CLOSE, { duration: 2000 });
      },
      error: err => {
        this.updateSerialized(item_name, event);
        this.snackBar.open(
          err?.error?.message
            ? err.error.message
            : `Error in updating item : ${err}`,
          CLOSE,
          { duration: 2000 },
        );
      },
    });
  }

  updateSerialized(item_name, event) {
    const data = this.dataSource.data;
    data.forEach(item => {
      item.item_name === item_name
        ? (item.has_serial_no = event ? 0 : 1)
        : null;
    });
    this.dataSource.update(data);
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

    this.dataSource.loadItems(query, sortQuery, 0, 30);
  }

  updatePurchaseWarrantyMonths(row: ListingData, days: number) {
    if (days == null) return;
    this.itemPriceService
      .setWarrantyMonths(row.uuid, { purchaseWarrantyMonths: days })
      .subscribe({
        next: success => (row.purchaseWarrantyMonths = days),
        error: error => {},
      });
  }

  updateSalesWarrantyMonths(row: ListingData, days: number) {
    if (days == null) return;

    this.itemPriceService
      .setWarrantyMonths(row.uuid, { salesWarrantyMonths: days })
      .subscribe({
        next: success => (row.salesWarrantyMonths = days),
        error: error => {},
      });
  }

  updateMinPrice(row: ListingData, minPrice: number) {
    if (minPrice == null) return;

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
    this.salesService
      .getItemPrice(data[index].name)
      .pipe(map(prices => (prices.length ? prices[0].price_list_rate : 0)))
      .subscribe({
        next: price => {
          data[index].selling_price = price;
          this.dataSource.update(data);
        },
        error: err => {
          this.snackBar.open(
            `Failed to load selling price: ${err?.error?.message}`,
            CLOSE,
            { duration: 2500 },
          );
        },
      });
  }
}
export interface DialogData {
  event: boolean;
}
@Component({
  selector: 'confirmation-dialog',
  template: `
    <div [innerHTML]="data?.event"></div>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-button [mat-dialog-close]="true" cdkFocusInitial>
        Reset
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmationDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}
}
