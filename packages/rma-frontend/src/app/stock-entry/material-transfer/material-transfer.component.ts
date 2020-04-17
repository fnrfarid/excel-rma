import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subject, Observable, of, from } from 'rxjs';
import { Location } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
  mergeMap,
  toArray,
  catchError,
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CLOSE, MATERIAL_TRANSFER } from '../../constants/app-string';
import * as _ from 'lodash';
import { FormControl } from '@angular/forms';
import { SalesService } from '../../sales-ui/services/sales.service';
import {
  MaterialTransferDataSource,
  StockEntryRow,
  MaterialTransferDto,
} from './material-transfer.datasource';
import { DEFAULT_COMPANY, TRANSFER_WAREHOUSE } from '../../constants/storage';
import { TimeService } from '../../api/time/time.service';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';
import { SerialsService } from '../../common/helpers/serials/serials.service';
import { CsvJsonObj } from '../../sales-ui/view-sales-invoice/serials/serials.component';
import { CsvJsonService } from '../../api/csv-json/csv-json.service';

@Component({
  selector: 'app-material-transfer',
  templateUrl: './material-transfer.component.html',
  styleUrls: ['./material-transfer.component.scss'],
})
export class MaterialTransferComponent implements OnInit {
  value: string;
  rangePickerState = {
    prefix: '',
    fromRange: '',
    toRange: '',
    serials: [],
  };
  company: string;
  filteredWarehouseList1: Observable<any[]>;
  filteredWarehouseList2: Observable<any[]>;
  transferWarehouse: string;
  warehouseState = {
    s_warehouse: new FormControl(''),
    t_warehouse: new FormControl(''),
  };

  @ViewChild('csvFileInput', { static: false })
  csvFileInput: ElementRef;

  materialTransferDataSource: MaterialTransferDataSource;
  fromRangeUpdate = new Subject<string>();
  toRangeUpdate = new Subject<string>();
  materialTransferDisplayedColumns = [
    's_warehouse',
    't_warehouse',
    'item_name',
    'qty',
    'serial_no',
    'delete',
  ];

  popWarehouse = switchMap((warehouses: any[]) => {
    return from(warehouses).pipe(
      mergeMap(warehouse => {
        if (warehouse.name === this.transferWarehouse) {
          return of();
        }
        return of(warehouse);
      }),
      toArray(),
    );
  });

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly location: Location,
    private readonly salesService: SalesService,
    private readonly timeService: TimeService,
    private readonly stockEntryService: StockEntryService,
    private readonly serialService: SerialsService,
    private readonly csvService: CsvJsonService,
  ) {
    this.onFromRange(this.value);
    this.onToRange(this.value);
  }

  async ngOnInit() {
    this.transferWarehouse = await this.salesService
      .getStore()
      .getItem(TRANSFER_WAREHOUSE);
    this.company = await this.salesService.getStore().getItem(DEFAULT_COMPANY);
    this.materialTransferDataSource = new MaterialTransferDataSource();
    this.filteredWarehouseList1 = this.warehouseState.s_warehouse.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const filter = `[["name","like","%${value}%"],["company","=","${this.company}"]]`;
        return this.salesService
          .getWarehouseList(value, filter)
          .pipe(this.popWarehouse);
      }),
      catchError(err => {
        this.getMessage('Error occurred in fetching warehouses.');
        return of([]);
      }),
    );

    this.filteredWarehouseList2 = this.warehouseState.t_warehouse.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const filter = `[["name","like","%${value}%"],["company","=","${this.company}"]]`;
        return this.salesService
          .getWarehouseList(value, filter)
          .pipe(this.popWarehouse);
      }),
    );
  }

  navigateBack() {
    this.location.back();
  }

  onFromRange(value) {
    this.fromRangeUpdate
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(v => {
        this.generateSerials(value, this.rangePickerState.toRange);
      });
  }

  onToRange(value) {
    this.toRangeUpdate
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(v => {
        this.generateSerials(this.rangePickerState.fromRange, value);
      });
  }

  generateSerials(fromRange?, toRange?) {
    this.rangePickerState.serials =
      this.serialService.getSerialsFromRange(
        fromRange || this.rangePickerState.fromRange || 0,
        toRange || this.rangePickerState.toRange || 0,
      ) || [];
  }

  deleteRow(row, i) {
    let materialTransferData = this.materialTransferDataSource.data();
    materialTransferData.length === 1
      ? (materialTransferData = [])
      : materialTransferData.splice(i, 1);
    this.materialTransferDataSource.update(materialTransferData);
  }

  addRow() {
    if (!this.validateMaterialTransferData()) return;
    this.salesService
      .getSerial(this.rangePickerState.serials[0])
      .pipe(
        switchMap((success: { item: ItemInterface }[]) => {
          return this.salesService.getItemByItemNames([
            success[0].item.item_name,
          ]);
        }),
      )
      .subscribe({
        next: (success: ItemInterface[]) => {
          this.assignSerials(this.rangePickerState.serials, success[0]);
        },
        error: err => {
          this.getMessage("Provided serial doesn't exist.");
        },
      });
  }

  assignSerials(serials, item: ItemInterface) {
    const materialTransferData = this.materialTransferDataSource.data();
    const materialTransferRow = new StockEntryRow();
    materialTransferRow.s_warehouse = this.warehouseState.s_warehouse.value;
    materialTransferRow.t_warehouse = this.warehouseState.t_warehouse.value;
    materialTransferRow.item_code = item.item_code;
    materialTransferRow.item_name = item.item_name;
    materialTransferRow.qty = serials.length;
    materialTransferRow.serial_no = serials;
    materialTransferRow.has_serial_no = item.has_serial_no;
    this.resetRangeState();
    materialTransferData.push(materialTransferRow);
    this.materialTransferDataSource.update(materialTransferData);
  }

  resetRangeState() {
    this.rangePickerState = {
      prefix: '',
      fromRange: '',
      toRange: '',
      serials: [],
    };
  }

  async createMaterialTransfer() {
    if (!this.transferWarehouse) {
      this.getMessage(
        'Please select a transfer warehouse in settings, for material transfer.',
      );
      return;
    }

    if (this.materialTransferDataSource.data().length === 0) {
      this.getMessage('Please Add serials for transfer');
      return;
    }
    const body = new MaterialTransferDto();
    const date = await this.timeService.getDateAndTime(new Date());
    body.company = this.company;
    body.posting_date = date.date;
    body.posting_time = date.time;
    body.stock_entry_type = MATERIAL_TRANSFER;
    body.items = this.materialTransferDataSource.data().filter(item => {
      item.transferWarehouse = this.transferWarehouse;
      return item;
    });

    this.stockEntryService.createMaterialTransfer(body).subscribe({
      next: response => {
        this.getMessage('Stock Entry Created');
        this.resetRangeState();
        this.materialTransferDataSource.update([]);
      },
      error: err => {
        this.getMessage(err.error.message);
      },
    });
  }

  validateMaterialTransferData() {
    return this.validateWarehouseState() && this.validateRangePickerState()
      ? true
      : false;
  }
  validateRangePickerState() {
    if (!this.rangePickerState.serials[0]) {
      this.getMessage('Please select a serial range.');
      return false;
    }
    return true;
  }

  validateWarehouseState() {
    if (
      !this.warehouseState.s_warehouse.value ||
      !this.warehouseState.t_warehouse.value
    ) {
      this.getMessage('Please select source and target warehouse.');
      return false;
    }
    return true;
  }

  getSerialsInputValue(row) {
    return row.serial_no.length === 1
      ? row.serial_no[0]
      : `${row.serial_no[0]} - ${row.serial_no[row.serial_no.length - 1]}`;
  }

  getMessage(notFoundMessage, expected?, found?) {
    return this.snackBar.open(notFoundMessage, CLOSE, { duration: 4500 });
  }

  fileChangedEvent($event): void {
    if (!this.validateWarehouseState()) {
      this.csvFileInput.nativeElement.value = '';
      return;
    }
    const reader = new FileReader();
    reader.readAsText($event.target.files[0]);
    reader.onload = (file: any) => {
      const csvData = file.target.result;
      const headers = csvData
        .split('\n')[0]
        .replace(/"/g, '')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .split(',');
      // validate file headers
      if (this.csvService.validateHeaders(headers)) {
        this.csvService
          .csvToJSON(csvData)
          .pipe(
            switchMap((json: any) => {
              const data = this.csvService.mapJson(json);
              const item_names = [];
              const itemObj: CsvJsonObj = {};

              for (const key in data) {
                if (key) {
                  item_names.push(key);
                  itemObj[key] = {
                    serial: data[key].serial_no.length,
                    serial_no: data[key].serial_no.map(serial => {
                      return serial.toUpperCase();
                    }),
                  };
                }
              }
              return of(itemObj);
            }),
          )
          .subscribe({
            next: (response: CsvJsonObj) => {
              response ? this.addSerialsFromCsvJson(response) : null;
              this.csvFileInput.nativeElement.value = '';
            },
            error: err => {
              this.csvFileInput.nativeElement.value = '';
            },
          });
      } else {
        this.csvFileInput.nativeElement.value = '';
      }
    };
  }

  addSerialsFromCsvJson(csvJsonObj: CsvJsonObj) {
    const item_names = Object.keys(csvJsonObj);
    return this.salesService
      .getItemByItemNames(item_names)
      .pipe(
        switchMap((items: ItemInterface[]) => {
          this.addItemCodeToCsvJson(csvJsonObj, items);
          return of();
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  addItemCodeToCsvJson(csvJsonObj: CsvJsonObj, items: ItemInterface[]) {
    items.forEach(item => {
      if (item.has_serial_no) {
        this.assignSerials(csvJsonObj[item.item_name].serial_no, item);
      } else {
        this.getMessage(
          `Provided item ${item.item_name}, is non serials item.`,
        );
      }
    });
  }
}

export class ItemInterface {
  item_code: string;
  item_name: string;
  has_serial_no: number;
}
