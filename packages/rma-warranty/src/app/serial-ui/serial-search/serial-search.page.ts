import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import {
  SERIAL_DOWNLOAD_HEADERS,
  CSV_FILE_TYPE,
} from '../../constants/app-string';
import { SerialSearchFields } from './search-fields.interface';
import { SerialSearchDataSource } from './serial-search-datasource';
import { SerialSearchService } from './serial-search.service';
import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime, startWith, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { SerialsService } from '../../common/helpers/serials/serials.service';
import { ValidateInputSelected } from '../../common/pipes/validators';
@Component({
  selector: 'app-serial-search',
  templateUrl: './serial-search.page.html',
  styleUrls: ['./serial-search.page.scss'],
})
export class SerialSearchPage implements OnInit {
  serialsList: Array<SerialSearchFields>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource: SerialSearchDataSource;
  displayedColumns = [
    'serial_no',
    'item_name',
    'item_code',
    'warehouse',
    'purchase_document_no',
    'delivery_note',
    'customer',
    'supplier',
  ];

  filtersForm = new FormGroup({
    serial_no: new FormControl(),
    item_code: new FormControl(),
    warehouse: new FormControl(),
    purchase_invoice_name: new FormControl({ value: true }),
    sales_invoice_name: new FormControl(),
  });
  validateInput: any = ValidateInputSelected;

  warehouseList: Observable<
    unknown[]
  > = this.filtersForm.controls.warehouse.valueChanges.pipe(
    debounceTime(500),
    startWith(''),
    this.serialSearchService.relayDocTypeOperation('Warehouse'),
  );

  filteredItemList: Observable<
    any[]
  > = this.filtersForm.controls.item_code.valueChanges.pipe(
    debounceTime(500),
    startWith(''),
    switchMap(value =>
      this.serialSearchService.getItemList(
        value,
        undefined,
        undefined,
        undefined,
        { bundle_items: { $exists: false }, has_serial_no: 1 },
      ),
    ),
  );

  constructor(
    private location: Location,
    private readonly serialSearchService: SerialSearchService,
    private readonly route: ActivatedRoute,
    private readonly serialService: SerialsService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(() => {
      this.paginator.firstPage();
    });
    this.dataSource = new SerialSearchDataSource(this.serialSearchService);
  }

  getOptionText(option) {
    return option && option.item_name ? option.item_name : '';
  }

  get f() {
    return this.filtersForm.controls;
  }

  getUpdate(event) {
    const query: any = this.getFilterQuery();
    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }
    this.dataSource.loadItems(
      sortQuery,
      event.pageIndex,
      event.pageSize,
      query,
    );
  }

  setFilter(event?) {
    const query: any = this.getFilterQuery();

    const sortQuery = {};
    if (event) {
      for (const key of Object.keys(event)) {
        if (key === 'active' && event.direction !== '') {
          sortQuery[event[key]] = event.direction;
        }
      }
    }

    this.dataSource.loadItems(
      sortQuery,
      this.paginator.pageIndex,
      this.paginator.pageSize,
      query,
    );
  }

  getFilterQuery() {
    const query: SerialSearchFields = {};
    Object.keys(this.filtersForm.controls).forEach(key => {
      switch (key) {
        case 'serial_no':
          this.filtersForm.controls[key].value
            ? (query[key] = {
                $regex: this.filtersForm.controls[key].value,
                $options: 'i',
              })
            : null;
          break;

        case 'purchase_invoice_name':
          query[key] = {
            $exists: this.filtersForm.controls[key].value ? true : false,
          };
          break;

        case 'sales_invoice_name':
          query[key] = {
            $exists: this.filtersForm.controls[key].value ? true : false,
          };
          break;

        default:
          query[key] =
            this.filtersForm.controls[key].value?.item_code ||
            this.filtersForm.controls[key].value;
          break;
      }
    });
    return query;
  }

  clearFilters() {
    this.filtersForm.controls.serial_no.setValue('');
    this.filtersForm.controls.item_code.setValue('');
    this.filtersForm.controls.warehouse.setValue('');
    this.filtersForm.controls.purchase_invoice_name.setValue('');
    this.filtersForm.controls.sales_invoice_name.setValue('');
    this.dataSource.loadItems(undefined, undefined, undefined, undefined);
  }

  navigateBack() {
    this.location.back();
  }

  downloadSerials() {
    this.serialService.downloadAsCSV(
      this.dataSource.data,
      SERIAL_DOWNLOAD_HEADERS,
      `Dump${CSV_FILE_TYPE}`,
    );
  }
}
