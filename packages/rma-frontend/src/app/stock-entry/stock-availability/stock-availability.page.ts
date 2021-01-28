import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';

import { StockAvailabilityDataSource } from './stock-availability-datasource';
import { SalesService } from '../../sales-ui/services/sales.service';
import { Observable } from 'rxjs';
import { ValidateInputSelected } from '../../common/pipes/validators';
import { startWith, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';

@Component({
  selector: 'app-stock-availability',
  templateUrl: './stock-availability.page.html',
  styleUrls: ['./stock-availability.page.scss'],
})
export class StockAvailabilityPage implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  dataSource: StockAvailabilityDataSource;
  defaultCompany: string;
  displayedColumns = ['item', 'warehouse', 'actual_qty'];
  filters: any = [];
  countFilter: any = {};
  stockAvailabilityForm: FormGroup;
  filteredStockAvailabilityList: Observable<any>;
  filteredWarehouseList: Observable<any[]>;
  validateInput: any = ValidateInputSelected;

  get f() {
    return this.stockAvailabilityForm.controls;
  }

  constructor(
    private readonly location: Location,
    private readonly salesService: SalesService,
    private readonly stockEntryService: StockEntryService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.createFormGroup();
    this.route.params.subscribe(() => {
      this.paginator.firstPage();
    });
    this.dataSource = new StockAvailabilityDataSource(this.salesService);
    this.dataSource.loadItems(0, 30, this.filters, this.countFilter);

    this.filteredStockAvailabilityList = this.stockAvailabilityForm
      .get('itemName')
      .valueChanges.pipe(
        startWith(''),
        switchMap(value => {
          return this.salesService.getItemList(value);
        }),
      );

    this.filteredWarehouseList = this.stockAvailabilityForm
      .get('warehouse')
      .valueChanges.pipe(
        startWith(''),
        switchMap(() => {
          return this.stockEntryService.getWarehouseList();
        }),
      );
  }

  createFormGroup() {
    this.stockAvailabilityForm = new FormGroup({
      itemName: new FormControl(),
      warehouse: new FormControl(),
    });
  }

  getStockAvailabilityOption(option) {
    if (option) {
      return option.name;
    }
  }

  getWarehouseOption(option) {
    if (option) {
      return option.name;
    }
  }

  clearFilters() {
    this.f.itemName.setValue('');
    this.f.warehouse.setValue('');
    this.setFilter();
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

    if (this.f.itemName.value) {
      this.filters.push([
        'item_code',
        'like',
        `%${this.f.itemName.value.item_code}%`,
      ]);
      this.countFilter.item_code = [
        'like',
        `%${this.f.itemName.value.item_code}%`,
      ];
    }

    if (this.f.warehouse.value) {
      this.filters.push([
        'warehouse',
        'like',
        `%${this.f.warehouse.value.name}%`,
      ]);
      this.countFilter.warehouse = ['like', `%${this.f.warehouse.value.name}%`];
    }
    this.dataSource.loadItems(0, 30, this.filters, this.countFilter);
  }

  navigateBack() {
    this.location.back();
  }
}
