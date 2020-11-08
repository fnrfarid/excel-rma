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
import { debounceTime, startWith } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { SerialsService } from '../../common/helpers/serials/serials.service';

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
    item_name: new FormControl(),
    warehouse: new FormControl(),
    purchase_document_no: new FormControl(),
    delivery_note: new FormControl(),
    customer: new FormControl(),
    supplier: new FormControl(),
  });

  customerList: Observable<
    unknown[]
  > = this.filtersForm.controls.customer.valueChanges.pipe(
    debounceTime(500),
    startWith(''),
    this.serialSearchService.relayDocTypeOperation('Customer'),
  );
  supplierList: Observable<
    unknown[]
  > = this.filtersForm.controls.supplier.valueChanges.pipe(
    debounceTime(500),
    startWith(''),
    this.serialSearchService.relayDocTypeOperation('Supplier'),
  );
  warehouseList: Observable<
    unknown[]
  > = this.filtersForm.controls.warehouse.valueChanges.pipe(
    debounceTime(500),
    startWith(''),
    this.serialSearchService.relayDocTypeOperation('Warehouse'),
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
      if (this.filtersForm.controls[key].value) {
        query[key] = this.filtersForm.controls[key].value;
      }
    });
    return query;
  }

  clearFilters() {
    this.filtersForm.controls.serial_no.setValue('');
    this.filtersForm.controls.item_code.setValue('');
    this.filtersForm.controls.item_name.setValue('');
    this.filtersForm.controls.warehouse.setValue('');
    this.filtersForm.controls.purchase_document_no.setValue('');
    this.filtersForm.controls.delivery_note.setValue('');
    this.filtersForm.controls.customer.setValue('');
    this.filtersForm.controls.supplier.setValue('');
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
