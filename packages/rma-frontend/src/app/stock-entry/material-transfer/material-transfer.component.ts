import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
} from '@angular/core';
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
import {
  CLOSE,
  MATERIAL_TRANSFER,
  DELIVERY_NOTE,
  WAREHOUSES,
  TERRITORY,
  STOCK_TRANSFER_STATUS,
} from '../../constants/app-string';
import * as _ from 'lodash';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { SalesService } from '../../sales-ui/services/sales.service';
import {
  MaterialTransferDataSource,
  StockEntryRow,
  MaterialTransferDto,
} from './material-transfer.datasource';
import {
  DEFAULT_COMPANY,
  TRANSFER_WAREHOUSE,
  AUTH_SERVER_URL,
} from '../../constants/storage';
import { TimeService } from '../../api/time/time.service';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';
import { SerialsService } from '../../common/helpers/serials/serials.service';
import {
  CsvJsonObj,
  AssignSerialsDialog,
  AssignNonSerialsItemDialog,
} from '../../sales-ui/view-sales-invoice/serials/serials.component';
import { CsvJsonService } from '../../api/csv-json/csv-json.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StockItemsDataSource } from './items-datasource';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { Item } from '../../common/interfaces/sales.interface';
import { ValidateInputSelected } from '../../common/pipes/validators';

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
  stock_receipt_names = [];
  readonly: boolean = false;
  company: string;
  status: string;
  remarks: string;
  filteredWarehouseList1: Observable<any[]>;
  filteredWarehouseList2: Observable<any[]>;
  transferWarehouse: string;
  warehouseState = {
    s_warehouse: new FormControl(''),
    t_warehouse: new FormControl(''),
  };
  validateInput: any = ValidateInputSelected;

  @ViewChild('csvFileInput', { static: false })
  csvFileInput: ElementRef;
  uuid: string;
  materialTransferDataSource: MaterialTransferDataSource;
  fromRangeUpdate = new Subject<string>();
  toRangeUpdate = new Subject<string>();
  territoryList: Observable<any[]>;
  initial: { [key: string]: number } = {
    s_warehouse: 0,
    territory: 0,
  };
  form: FormGroup;
  materialTransferDisplayedColumns = [
    's_warehouse',
    't_warehouse',
    'item_name',
    'qty',
    'serial_no',
    'delete',
  ];
  itemDataSource: StockItemsDataSource;
  itemDisplayedColumns = [
    'item_name',
    'assigned',
    'available_stock',
    'has_serial_no',
    'add_serial',
    'delete',
  ];

  popWarehouse = switchMap((warehouses: any[]) => {
    return from(warehouses).pipe(
      mergeMap(warehouse => {
        if (
          warehouse.name === this.transferWarehouse ||
          warehouse === this.transferWarehouse
        ) {
          return of();
        }
        return of(warehouse);
      }),
      toArray(),
    );
  });

  CATCH_ERROR: any = catchError(err => {
    this.getMessage('Error occurred in fetching warehouses.');
    return of([]);
  });

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly location: Location,
    private readonly salesService: SalesService,
    private readonly timeService: TimeService,
    public dialog: MatDialog,
    private readonly stockEntryService: StockEntryService,
    private readonly serialService: SerialsService,
    private readonly csvService: CsvJsonService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.onFromRange(this.value);
    this.onToRange(this.value);
  }

  async ngOnInit() {
    this.form = new FormGroup({
      territory: new FormControl('', [Validators.required]),
    });
    this.itemDataSource = new StockItemsDataSource();
    this.transferWarehouse = await this.salesService
      .getStore()
      .getItem(TRANSFER_WAREHOUSE);
    this.company = await this.salesService.getStore().getItem(DEFAULT_COMPANY);
    this.materialTransferDataSource = new MaterialTransferDataSource();
    this.uuid = this.activatedRoute.snapshot.params.uuid;

    if (this.uuid) {
      this.readonly = true;
      this.stockEntryService.getStockEntry(this.uuid).subscribe({
        next: (success: any) => {
          if (success.status === STOCK_TRANSFER_STATUS.draft) {
            this.readonly = false;
            this.subscribeEndpoints();
          }
          this.stock_receipt_names = success.names || [];
          this.status = success.status;
          this.remarks = success.remarks;
          this.form.get('territory').setValue(success.territory);
          this.form.get('territory').disable();
          this.materialTransferDataSource.update(success.items);
        },
        error: err => {},
      });
      return;
    }

    this.subscribeEndpoints();
  }

  get f() {
    return this.form.controls;
  }

  subscribeEndpoints() {
    this.filteredWarehouseList1 = this.warehouseState.s_warehouse.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        return this.salesService
          .getStore()
          .getItemAsync(WAREHOUSES, value)
          .pipe(this.popWarehouse);
      }),
      switchMap(data => {
        if (data && data.length) {
          this.initial.s_warehouse
            ? null
            : (this.warehouseState.s_warehouse.setValue(data[0]),
              this.initial.s_warehouse++);
          return of(data);
        }
        return of([]);
      }),
      this.CATCH_ERROR,
    );

    this.filteredWarehouseList2 = this.warehouseState.t_warehouse.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const filter = `[["name","like","%${value}%"],["is_group","=",0]]`;
        return this.salesService
          .getWarehouseList(value, filter, true)
          .pipe(this.popWarehouse);
      }),
      this.CATCH_ERROR,
    );

    this.territoryList = this.form.get('territory').valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getStore().getItemAsync(TERRITORY, value);
      }),
      switchMap(data => {
        if (data && data.length) {
          this.initial.territory
            ? null
            : (this.form.get('territory').setValue(data[0]),
              this.initial.territory++);
          return of(data);
        }
        return of([]);
      }),
    );
  }

  navigateBack() {
    this.location.back();
  }

  rejectTransfer() {
    this.stockEntryService.rejectMaterialTransfer(this.uuid).subscribe({
      next: success => {
        this.router.navigateByUrl('stock-entry');
        this.getMessage('Stock entry returned successfully');
      },
      error: err => {
        this.getMessage(
          err.error && err.error.message
            ? err.error.message
            : 'Error occurred while returning stock transfer',
        );
      },
    });
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

  async addItems() {
    const dialogRef = this.dialog.open(AddItemDialog, {
      width: '250px',
      data: { item: undefined },
    });
    const item = await dialogRef.afterClosed().toPromise();

    if (item) {
      const data = this.itemDataSource.data();
      data.push({
        item_code: item.item_code,
        item_name: item.item_name,
        assigned: 0,
        has_serial_no: item.has_serial_no,
      });
      this.itemDataSource.update(data);
      this.updateItemStock();
    }
  }

  deleteItemRow(row, i) {
    let serialData = this.itemDataSource.data();
    serialData.length === 1 ? (serialData = []) : serialData.splice(i, 1);

    this.itemDataSource.update(serialData);
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
    this.updateProductState(row.item_code, -row.qty);
  }

  async assignSingularSerials(row: Item) {
    const dialogRef = this.dialog.open(AssignSerialsDialog, {
      width: '250px',
      data: { serials: row.remaining || 0 },
    });

    const serials = await dialogRef.afterClosed().toPromise();

    if (serials) {
      this.addSingularSerials(row, serials);
      this.resetRangeState();
      this.updateProductState(row, serials);
      return;
    }

    this.snackBar.open('Please select a valid number of rows.', CLOSE, {
      duration: 2500,
    });
  }

  updateItemStock(warehouse?) {
    this.itemDataSource.loadingSubject.next(true);
    warehouse = warehouse ? warehouse : this.warehouseState.s_warehouse.value;
    if (!warehouse) {
      this.getMessage(
        'Please select a source warehouse to get available stock',
      );
      this.itemDataSource.loadingSubject.next(false);
      return;
    }
    const items = [];
    this.itemDataSource.data().forEach(item => items.push(item.item_code));

    if (!items.length) {
      this.itemDataSource.loadingSubject.next(false);
      return;
    }

    this.salesService.getItemStock(items, warehouse).subscribe({
      next: (res: any) => {
        this.itemDataSource.loadingSubject.next(false);
        const existing_items = this.itemDataSource.data();
        if (res && res.data) {
          res.data.forEach(element => {
            existing_items.filter(item => {
              if (item.item_code === element.item_code) {
                item.available_stock = element.actual_qty;
              }
              return item;
            });
            this.itemDataSource.update(existing_items);
          });
        }
      },
      error: err => {
        this.itemDataSource.loadingSubject.next(false);
        this.getMessage('Error occurred in fetching stock for items');
      },
    });
  }

  updateProductState(item_code, assigned) {
    const itemState = this.itemDataSource.data();
    itemState.filter(product => {
      if (product.item_code === item_code) {
        product.assigned = product.assigned + assigned;
      }
      return product;
    });
    this.itemDataSource.update(itemState);
  }

  addSingularSerials(row: Item, serialCount) {
    this.updateProductState(row.item_code, serialCount);
    const serials = this.materialTransferDataSource.data();
    Array.from({ length: serialCount }, async (x, i) => {
      serials.push({
        item_code: row.item_code,
        item_name: row.item_name,
        qty: 1,
        transferWarehouse: this.transferWarehouse,
        s_warehouse: this.warehouseState.s_warehouse.value,
        t_warehouse: this.warehouseState.t_warehouse.value,
        has_serial_no: row.has_serial_no,
        serial_no: [''],
      });
      this.materialTransferDataSource.update(serials);
    });
  }

  addRow(itemRow) {
    if (!this.validateWarehouseState()) return;
    if (!itemRow.has_serial_no) {
      this.addNonSerialItem(itemRow);
      return;
    }
    if (
      !this.rangePickerState.serials.length ||
      this.rangePickerState.serials.length === 1
    ) {
      this.assignSingularSerials(itemRow);
      return;
    }
    if (itemRow.remaining < this.rangePickerState.serials.length) {
      this.snackBar.open(
        `Only ${itemRow.remaining} serials could be assigned to ${itemRow.item_code}`,
        CLOSE,
        { duration: 2500 },
      );
      return;
    }
    this.validateSerial(
      { item_code: itemRow.item_code, serials: this.rangePickerState.serials },
      itemRow,
    );
  }

  validateSerial(
    item: {
      item_code: string;
      serials: string[];
      warehouse?: string;
      validateFor?: string;
    },
    row: Item,
  ) {
    item.warehouse = this.warehouseState.s_warehouse.value;
    item.validateFor = DELIVERY_NOTE;
    this.salesService.validateSerials(item).subscribe({
      next: (success: { notFoundSerials: string[] }) => {
        if (success.notFoundSerials && success.notFoundSerials.length) {
          this.snackBar.open(
            `Found ${success.notFoundSerials.length} Invalid Serials for
              item: ${item.item_code} at
              warehouse: ${item.warehouse},
              ${success.notFoundSerials.splice(0, 5).join(', ')}...`,
            CLOSE,
            { duration: 5500 },
          );
          return;
        }
        this.assignRangeSerial(row, this.rangePickerState.serials);
      },
      error: err => {},
    });
  }

  async assignRangeSerial(row: Item, serials: string[]) {
    const data = this.materialTransferDataSource.data();
    data.push({
      item_code: row.item_code,
      item_name: row.item_name,
      qty: serials.length,
      has_serial_no: row.has_serial_no,
      transferWarehouse: this.transferWarehouse,
      s_warehouse: this.warehouseState.s_warehouse.value,
      t_warehouse: this.warehouseState.t_warehouse.value,
      serial_no: serials,
    });
    this.updateProductState(row.item_code, serials.length);
    this.materialTransferDataSource.update(data);
    this.resetRangeState();
  }

  async addNonSerialItem(row: Item) {
    const dialogRef = this.dialog.open(AssignNonSerialsItemDialog, {
      width: '250px',
      data: { qty: row.remaining || 0, remaining: row.remaining },
    });
    const assignValue = await dialogRef.afterClosed().toPromise();

    if ((assignValue || 0) + row.assigned > row.available_stock) {
      this.getMessage(
        `Cannot assign ${(assignValue || 0) + row.assigned}, Only ${
          row.available_stock - (row.assigned || 0)
        } available.`,
      );
      return;
    }

    if (assignValue) {
      const serials = this.materialTransferDataSource.data();
      serials.push({
        item_code: row.item_code,
        item_name: row.item_name,
        qty: assignValue,
        has_serial_no: row.has_serial_no,
        transferWarehouse: this.transferWarehouse,
        s_warehouse: this.warehouseState.s_warehouse.value,
        t_warehouse: this.warehouseState.t_warehouse.value,
        serial_no: ['Non Serial Item'],
      });
      this.materialTransferDataSource.update(serials);
      this.updateProductState(row.item_code, assignValue);
      return;
    }
    this.snackBar.open('Please select a valid number of rows.', CLOSE, {
      duration: 2500,
    });
  }

  acceptTransfer() {
    this.stockEntryService.acceptMaterialTransfer(this.uuid).subscribe({
      next: success => {
        this.router.navigateByUrl('stock-entry');
        this.getMessage('Stock entry accepted successfully');
      },
      error: err => {
        this.getMessage(
          err.error && err.error.message
            ? err.error.message
            : 'Error occurred while accepting stock transfer',
        );
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
    const body = await this.getStockEntryBody();
    this.stockEntryService.createMaterialTransfer(body).subscribe({
      next: response => {
        this.getMessage('Stock Entry Created');
        this.resetRangeState();
        this.materialTransferDataSource.update([]);
        this.router.navigateByUrl('stock-entry');
      },
      error: err => {
        this.getMessage(err.error.message);
      },
    });
  }

  async getStockEntryBody(): Promise<MaterialTransferDto> {
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
    body.territory = this.form.get('territory').value;
    body.remarks = this.remarks;
    body.posting_date = date.date;
    body.posting_time = date.time;
    body.stock_entry_type = MATERIAL_TRANSFER;
    body.items = this.materialTransferDataSource.data();
    body.items = this.mergeItems(body.items);
    body.uuid = this.uuid;
    return body;
  }

  async saveDraft() {
    const body = await this.getStockEntryBody();
    body.status = STOCK_TRANSFER_STATUS.draft;
    this.stockEntryService.createMaterialTransfer(body).subscribe({
      next: response => {
        this.getMessage('Stock Entry Saved');
      },
      error: err => {
        this.getMessage(err.error.message);
      },
    });
  }

  mergeItems(items: Item[]) {
    const hash = {};
    const merged_items = [];
    items.forEach(item => {
      if (hash[item.item_code]) {
        hash[item.item_code].qty += item.qty;
        if (item.has_serial_no) {
          hash[item.item_code].serial_no.push(...item.serial_no);
        }
        return;
      }
      hash[item.item_code] = item;
    });
    Object.keys(hash).forEach(key => {
      merged_items.push(hash[key]);
    });
    return merged_items;
  }

  validateWarehouseState() {
    if (
      !this.warehouseState.s_warehouse.value ||
      !this.warehouseState.t_warehouse.value
    ) {
      this.getMessage('Please select source and target warehouse.');
      return false;
    }

    if (
      this.warehouseState.s_warehouse.value ===
      this.warehouseState.t_warehouse.value
    ) {
      this.getMessage(
        'Source warehouse and target warehouse should be unique.',
      );
      return false;
    }
    return true;
  }

  getSerialsInputValue(row) {
    if (row.serial_no && row.serial_no.length === 1) {
      return row.serial_no[0];
    }
    if (row.serial_no && row.serial_no.length > 1) {
      return `${row.serial_no[0]} - ${row.serial_no[row.serial_no.length - 1]}`;
    }
    return '';
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

  openStockEntries() {
    this.salesService
      .getStore()
      .getItem(AUTH_SERVER_URL)
      .then(url => {
        const filter = `name=["in","${this.stock_receipt_names.join()}"]`;
        window.open(`${url}/desk#List/Stock Entry/List?${filter}`, '_blank');
      });
  }
}

export class ItemInterface {
  item_code: string;
  item_name: string;
  has_serial_no: number;
}

@Component({
  selector: 'add-item-dialog',
  templateUrl: 'add-item-dialog.html',
})
export class AddItemDialog {
  filteredItemList: Observable<any[]>;
  itemFormControl = new FormControl();
  validateInput: any = ValidateInputSelected;

  constructor(
    public dialogRef: MatDialogRef<AddItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private salesService: SalesService,
  ) {
    this.getItemList();
  }

  onNoClick(): void {
    this.dialogRef.close(this.itemFormControl.value);
  }

  getItemList() {
    this.filteredItemList = this.itemFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getItemList(value);
      }),
    );
  }

  getOptionText(option) {
    return option && option.item_name ? option.item_name : '';
  }
}
