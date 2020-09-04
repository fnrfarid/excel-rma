import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable, Subject, of, from } from 'rxjs';
import { PurchaseInvoiceDetails } from '../../../common/interfaces/purchase.interface';
import { PurchaseService } from '../../services/purchase.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  startWith,
  switchMap,
  debounceTime,
  distinctUntilChanged,
  map,
  bufferCount,
  delay,
  mergeMap,
  toArray,
} from 'rxjs/operators';
import { SalesService } from '../../../sales-ui/services/sales.service';
import {
  CLOSE,
  PURCHASE_RECEIPT,
  WAREHOUSES,
  ASSIGN_SERIAL_DIALOG_QTY,
} from '../../../constants/app-string';
import { ERROR_FETCHING_PURCHASE_INVOICE } from '../../../constants/messages';
import {
  PurchaseReceipt,
  PurchaseReceiptItem,
} from '../../../common/interfaces/purchase-receipt.interface';
import { Location } from '@angular/common';
import { LoadingController } from '@ionic/angular';
import {
  ItemDataSource,
  SerialDataSource,
} from '../../../sales-ui/view-sales-invoice/serials/serials-datasource';
import * as _ from 'lodash';
import { Item } from '../../../common/interfaces/sales.interface';
import {
  AssignSerialsDialog,
  CsvJsonObj,
  AssignNonSerialsItemDialog,
} from '../../../sales-ui/view-sales-invoice/serials/serials.component';
import { CsvJsonService } from '../../../api/csv-json/csv-json.service';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../constants/date-format';
import { PurchasedSerialsDataSource } from './purchase-serials-datasource';
import { TimeService } from '../../../api/time/time.service';
import { SerialsService } from '../../../common/helpers/serials/serials.service';

@Component({
  selector: 'purchase-assign-serials',
  templateUrl: './purchase-assign-serials.component.html',
  styleUrls: ['./purchase-assign-serials.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class PurchaseAssignSerialsComponent implements OnInit {
  @ViewChild('csvFileInput', { static: false })
  csvFileInput: ElementRef;

  warehouseFormControl = new FormControl('', [Validators.required]);
  dataSource = [];
  csvFile: any;
  value: string;
  date = new FormControl(new Date());
  purchaseReceiptDate: string;

  filteredWarehouseList: Observable<any[]>;
  purchaseInvoiceDetails: PurchaseInvoiceDetails;
  getOptionText = '';

  rangePickerState = {
    prefix: '',
    fromRange: '',
    toRange: '',
    serials: [],
  };

  fromRangeUpdate = new Subject<string>();
  toRangeUpdate = new Subject<string>();
  itemDisplayedColumns = [
    'item_name',
    'qty',
    'assigned',
    'remaining',
    'has_serial_no',
    'purchaseWarrantyMonths',
    'add_serial',
  ];
  itemDataSource: ItemDataSource;
  serialDisplayedColumns = [
    'item_code',
    'item_name',
    'qty',
    'warranty_date',
    'serial_no',
    'delete',
  ];
  serialDataSource: SerialDataSource;
  deliveredSerialsDisplayedColumns = [
    'sr_no',
    'item_name',
    'warehouse',
    'purchase_warranty_period',
    'purchase_warranty_expiry',
    'serial_no',
  ];
  purchasedSerialsDataSource: PurchasedSerialsDataSource;
  displayDeliveredSerialsTable: boolean = false;
  remaining: number = 0;
  deliveredSerialsSearch: string = '';
  filteredItemList = [];
  index: number = 0;
  size: number = 10;
  itemMap: any = {};
  initial: { [key: string]: number } = {
    warehouse: 0,
  };

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly purchaseService: PurchaseService,
    private readonly location: Location,
    private readonly salesService: SalesService,
    public dialog: MatDialog,
    private loadingController: LoadingController,
    private readonly timeService: TimeService,
    private readonly csvService: CsvJsonService,
    private readonly serialsService: SerialsService,
  ) {}

  ngOnInit() {
    this.onFromRange(this.value);
    this.onToRange(this.value);
    this.serialDataSource = new SerialDataSource();
    this.itemDataSource = new ItemDataSource();
    this.purchasedSerialsDataSource = new PurchasedSerialsDataSource(
      this.purchaseService,
    );
    this.purchaseReceiptDate = this.getParsedDate(this.date.value);
    this.getPurchaseInvoice(this.route.snapshot.params.invoiceUuid);
    this.filteredWarehouseList = this.warehouseFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getStore().getItemAsync(WAREHOUSES, value);
      }),
      switchMap(data => {
        if (data && data.length) {
          this.initial.warehouse
            ? null
            : (this.warehouseFormControl.setValue(data[0]),
              this.initial.warehouse++);
          return of(data);
        }
        return of([]);
      }),
    );
  }

  getFilteredItems(purchaseInvoice: PurchaseInvoiceDetails) {
    const filteredItemList = [];
    let remaining = 0;
    purchaseInvoice.items.forEach(item => {
      this.itemMap[item.item_code] = item;
      item.assigned = 0;
      item.remaining = item.qty;
      if (purchaseInvoice.purchase_receipt_items_map[item.item_code]) {
        item.assigned =
          purchaseInvoice.purchase_receipt_items_map[item.item_code] || 0;
        item.remaining =
          item.qty - purchaseInvoice.purchase_receipt_items_map[item.item_code];
      }
      remaining += item.remaining;
      filteredItemList.push(item);
    });
    this.remaining = remaining;
    return filteredItemList;
  }

  getPurchaseInvoice(uuid: string) {
    this.purchaseService.getPurchaseInvoice(uuid).subscribe({
      next: (res: PurchaseInvoiceDetails) => {
        this.purchaseInvoiceDetails = res as PurchaseInvoiceDetails;
        this.filteredItemList = this.getFilteredItems(res);
        this.itemDataSource.loadItems(this.filteredItemList);
        this.displayDeliveredSerialsTable =
          Object.keys(res.purchase_receipt_items_map).length !== 0
            ? true
            : false;
        this.getItemsWarranty();
      },
      error: err => {
        this.snackBar.open(
          err.error.message
            ? err.error.message
            : `${ERROR_FETCHING_PURCHASE_INVOICE}${err.error.error}`,
          CLOSE,
          { duration: 2500 },
        );
      },
    });
  }

  getDeliveredSerials() {
    this.purchasedSerialsDataSource.loadItems(
      this.purchaseInvoiceDetails.name,
      this.deliveredSerialsSearch,
      this.index,
      this.size,
    );
  }

  setFilter() {
    this.getDeliveredSerials();
  }

  getUpdate(event) {
    this.index = event.pageIndex;
    this.size = event.pageSize;
    this.purchasedSerialsDataSource.loadItems(
      this.purchaseInvoiceDetails.name,
      this.deliveredSerialsSearch,
      this.index,
      this.size,
    );
  }

  async submitPurchaseReceipt() {
    if (!this.validateState()) return;

    const loading = await this.loadingController.create({
      message: 'Validating Purchase Receipt...',
    });
    await loading.present();

    const purchaseReceipt = {} as PurchaseReceipt;
    purchaseReceipt.company = this.purchaseInvoiceDetails.company;
    purchaseReceipt.naming_series = this.purchaseInvoiceDetails.naming_series;
    purchaseReceipt.posting_date = this.getParsedDate(this.date.value);
    purchaseReceipt.posting_time = this.getFrappeTime();
    purchaseReceipt.purchase_invoice_name = this.purchaseInvoiceDetails.name;
    purchaseReceipt.supplier = this.purchaseInvoiceDetails.supplier;
    purchaseReceipt.total = 0;
    purchaseReceipt.total_qty = 0;
    purchaseReceipt.items = [];

    const filteredItemCodeList = [
      ...new Set(this.serialDataSource.data().map(item => item.item_code)),
    ];

    for (const item_code of filteredItemCodeList) {
      const purchaseReceiptItem = {} as PurchaseReceiptItem;
      purchaseReceiptItem.warehouse = this.warehouseFormControl.value;
      purchaseReceiptItem.serial_no = [];
      purchaseReceiptItem.qty = 0;
      purchaseReceiptItem.amount = 0;
      purchaseReceiptItem.rate = 0;
      purchaseReceiptItem.item_code = item_code;
      for (const item of this.serialDataSource.data()) {
        if (item_code === item.item_code && item.serial_no.length !== 0) {
          purchaseReceiptItem.has_serial_no = item.has_serial_no || 0;
          purchaseReceiptItem.warranty_date = item.warranty_date;
          purchaseReceiptItem.qty += item.qty;
          purchaseReceiptItem.amount += item.rate * item.qty;
          for (const serial_no of item.serial_no) {
            purchaseReceiptItem.serial_no.push(serial_no);
          }
          purchaseReceiptItem.rate = item.rate;
          purchaseReceiptItem.item_name = item.item_name;
        }
      }
      purchaseReceipt.total += purchaseReceiptItem.amount;
      purchaseReceipt.total_qty += purchaseReceiptItem.qty;
      purchaseReceipt.items.push(purchaseReceiptItem);
    }

    this.purchaseService.createPurchaseReceipt(purchaseReceipt).subscribe({
      next: success => {
        loading.dismiss();
        this.snackBar.open('Purchase Receipt are added to the queue.', CLOSE, {
          duration: 2500,
        });
        this.location.back();
      },
      error: err => {
        let frappeError = 'Purchase Receipt Creation failed';

        try {
          frappeError = JSON.parse(err.error._server_messages);
          frappeError = JSON.parse(frappeError);
          frappeError = (frappeError as { message?: string }).message;
        } catch {
          frappeError = err.error.message;
        }
        loading.dismiss();
        this.snackBar.open(frappeError, CLOSE, {
          duration: 2500,
        });
      },
    });
  }

  getItemsWarranty() {
    from(this.itemDataSource.data())
      .pipe(
        mergeMap(item => {
          return this.salesService.getItemFromRMAServer(item.item_code).pipe(
            switchMap(warrantyItem => {
              item.purchaseWarrantyMonths = warrantyItem.purchaseWarrantyMonths;
              return of(item);
            }),
          );
        }),
        toArray(),
      )
      .subscribe({
        next: success => {
          success.forEach(item => {
            this.itemMap[item.item_code].purchaseWarrantyMonths =
              item.purchaseWarrantyMonths;
          });
          this.itemDataSource.loadItems(success);
        },
        error: err => {},
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

  generateSerials(fromRange?, toRange?) {
    this.rangePickerState.serials =
      this.serialsService.getSerialsFromRange(
        fromRange || this.rangePickerState.fromRange || 0,
        toRange || this.rangePickerState.toRange || 0,
      ) || [];
  }

  async assignSingularSerials(row: Item) {
    const dialogRef =
      row.remaining >= ASSIGN_SERIAL_DIALOG_QTY
        ? this.dialog.open(AssignSerialsDialog, {
            width: '250px',
            data: { serials: row.remaining || 0 },
          })
        : null;

    const serials =
      row.remaining >= ASSIGN_SERIAL_DIALOG_QTY
        ? await dialogRef.afterClosed().toPromise()
        : row.remaining;
    if (serials) {
      this.addSingularSerials(row, serials);
      this.resetRangeState();
      this.updateProductState(row, serials);
    }
  }

  async assignRangeSerial(row: Item, serials: string[]) {
    const data = this.serialDataSource.data();
    data.push({
      item_code: row.item_code,
      item_name: row.item_name,
      qty: serials.length,
      rate: row.rate,
      warranty_date: await this.getWarrantyDate(row.purchaseWarrantyMonths),
      has_serial_no: row.has_serial_no,
      amount: row.amount,
      serial_no: serials,
    });
    this.updateProductState(row.item_code, serials.length);
    this.serialDataSource.update(data);
    this.resetRangeState();
  }

  async addNonSerialItem(row: Item) {
    const dialogRef = this.dialog.open(AssignNonSerialsItemDialog, {
      width: '250px',
      data: { qty: row.remaining || 0, remaining: row.remaining },
    });

    const assignValue = await dialogRef.afterClosed().toPromise();
    if (assignValue && assignValue <= row.remaining) {
      const serials = this.serialDataSource.data();
      serials.push({
        item_code: row.item_code,
        item_name: row.item_name,
        qty: assignValue,
        warranty_date: await this.getWarrantyDate(row.purchaseWarrantyMonths),
        rate: row.rate,
        amount: row.amount,
        has_serial_no: row.has_serial_no,
        serial_no: ['Non Serial Item'],
      });
      this.serialDataSource.update(serials);
      this.updateProductState(row.item_code, assignValue);
      return;
    }

    this.snackBar.open('Please select a valid number of rows.', CLOSE, {
      duration: 2500,
    });
  }

  assignSerial(itemRow: Item) {
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
    item: { item_code: string; serials: string[]; validateFor?: string },
    row: Item,
  ) {
    const notFoundSerials = [];
    item.validateFor = 'purchase_receipt';
    return from(item.serials)
      .pipe(
        map(serial => serial),
        bufferCount(4000),
        delay(200),
        switchMap(serialsBatch => {
          const data = item;
          data.serials = serialsBatch;
          return this.salesService.validateSerials(item).pipe(
            switchMap((response: { notFoundSerials: string[] }) => {
              notFoundSerials.push(...response.notFoundSerials);
              return of({ notFoundSerials });
            }),
          );
        }),
      )
      .subscribe({
        next: (success: { notFoundSerials: string[] }) => {
          success.notFoundSerials && success.notFoundSerials.length === 0
            ? this.assignRangeSerial(row, this.rangePickerState.serials)
            : this.snackBar.open(
                `Invalid Serials ${this.getInvalidSerials(
                  item.serials,
                  success.notFoundSerials,
                )
                  .splice(0, 5)
                  .join(', ')}...`,
                CLOSE,
                { duration: 2500 },
              );
        },
        error: err => {},
      });
  }

  getInvalidSerials(arr1, arr2) {
    return _.difference(arr1, arr2);
  }

  addSingularSerials(row, serialCount) {
    this.updateProductState(row.item_code, serialCount);
    const serials = this.serialDataSource.data();
    Array.from({ length: serialCount }, async (x, i) => {
      serials.push({
        item_code: row.item_code,
        item_name: row.item_name,
        warranty_date: await this.getWarrantyDate(row.purchaseWarrantyMonths),
        qty: 1,
        rate: row.rate,
        has_serial_no: row.has_serial_no,
        amount: row.amount,
        serial_no: [''],
      });
      this.serialDataSource.update(serials);
    });
  }

  validateState() {
    const data = this.serialDataSource.data();
    let isValid = true;
    let index = 0;
    if (!this.warehouseFormControl.value) {
      this.snackBar.open('Please select a warehouse.', CLOSE, {
        duration: 3000,
      });
      return false;
    }
    for (const item of data) {
      index++;
      if (!item.warranty_date) {
        isValid = false;
        this.getMessage(
          `Warranty date empty for ${item.item_name} at position ${index}, please add a warranty date`,
        );
        break;
      }
      if (
        !item.serial_no ||
        !item.serial_no.length ||
        item.serial_no[0] === ''
      ) {
        isValid = false;
        this.getMessage(
          `Serial No empty for ${item.item_name} at position ${index}, please add a Serial No`,
        );
        break;
      }
    }
    return isValid;
  }

  async getWarrantyDate(purchaseWarrantyMonths: number) {
    let date = new Date();
    let dateTime;
    if (purchaseWarrantyMonths) {
      try {
        date = new Date(
          date.setMonth(date.getMonth() + purchaseWarrantyMonths),
        );
        dateTime = await this.timeService.getDateAndTime(date);
        return dateTime.date;
      } catch (err) {
        this.getMessage(`Error occurred while settings warranty date: ${err}`);
      }
    }
    return;
  }

  updateProductState(item_code, assigned) {
    const itemState = this.itemDataSource.data();
    itemState.filter(product => {
      if (product.item_code === item_code) {
        product.assigned = product.assigned + assigned;
        product.remaining = product.qty - product.assigned;
      }
      return product;
    });
    this.itemDataSource.update(itemState);
  }

  deleteRow(row, i) {
    let serialData = this.serialDataSource.data();
    serialData.length === 1 ? (serialData = []) : serialData.splice(i, 1);

    this.serialDataSource.update(serialData);
    let itemData = this.itemDataSource.data();

    itemData = itemData.filter(item => {
      if (item.item_code === row.item_code) {
        item.assigned = item.assigned - row.qty;
        item.remaining = item.remaining + row.qty;
      }
      return item;
    });

    this.itemDataSource.update(itemData);
  }

  getSerialsInputValue(row) {
    return row.serial_no.length === 1
      ? row.serial_no[0]
      : `${row.serial_no[0]} - ${row.serial_no[row.serial_no.length - 1]}`;
  }

  resetRangeState() {
    this.rangePickerState = {
      prefix: '',
      fromRange: '',
      toRange: '',
      serials: [],
    };
  }

  updateSerial(element, serial_no) {
    if (serial_no) {
      const index = this.dataSource.indexOf(element);
      this.dataSource[index].serial_no = serial_no;
      this.salesService.getSerial(serial_no).subscribe({
        next: res => {
          this.dataSource[index].serial_no = '';
          this.snackBar.open('Serial No already in use.', CLOSE, {
            duration: 2500,
          });
        },
        error: err => {},
      });
    }
  }

  clearRow(element) {
    const index = this.dataSource.indexOf(element);
    this.dataSource[index].serial_no = '';
    this.dataSource[index].supplier = '';
  }

  getFrappeTime() {
    const date = new Date();
    return [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
  }

  selectedPurchaseReceiptDate($event) {
    this.purchaseReceiptDate = this.getParsedDate($event.value);
    this.dataSource.forEach((item, index) => {
      this.dataSource[index].claimsReceivedDate = this.purchaseReceiptDate;
    });
  }

  getParsedDate(value) {
    const date = new Date(value);
    return [
      date.getDate(),
      date.getMonth() + 1,
      // +1 as index of months start's from 0
      date.getFullYear(),
    ].join('-');
  }

  async fileChangedEvent($event) {
    const loading = await this.loadingController.create({
      message: 'Fetching And validating serials for Purchase Receipt...!',
    });
    await loading.present();

    const reader = new FileReader();
    reader.readAsText($event.target.files[0]);
    reader.onload = (file: any) => {
      const csvData = file.target.result;
      const headers = csvData
        .split('\n')[0]
        .replace(/"/g, '')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        .split(',');
      if (this.csvService.validateHeaders(headers)) {
        this.csvService
          .csvToJSON(csvData)
          .pipe(
            switchMap(json => {
              const hashMap = this.csvService.mapJson(json);
              const item_names = [];
              item_names.push(...Object.keys(hashMap));
              if (this.validateJson(hashMap)) {
                return this.csvService
                  .validateSerials(item_names, hashMap, PURCHASE_RECEIPT)
                  .pipe(
                    switchMap((response: boolean) => {
                      this.csvFileInput.nativeElement.value = '';
                      if (response) {
                        this.getMessage('Serials Validated Successfully.');
                        return of(hashMap);
                      }
                      return of(false);
                    }),
                  );
              }
              return of(false);
            }),
          )
          .subscribe({
            next: (response: CsvJsonObj | boolean) => {
              loading.dismiss();
              if (response) {
                this.addSerialsFromCsvJson(response);
              }
              this.csvFileInput.nativeElement.value = '';
            },
            error: err => {
              this.getMessage(
                'Error occurred while validation of serials : ' +
                  (err && err.error && err.error.message)
                  ? err.error.message
                  : '',
              );
              loading.dismiss();
              this.csvFileInput.nativeElement.value = '';
            },
          });
      } else {
        loading.dismiss();
        this.csvFileInput.nativeElement.value = '';
      }
    };
  }

  validateJson(json: CsvJsonObj) {
    let isValid = true;
    const data = this.itemDataSource.data();
    for (const value of data) {
      if (json[value.item_name]) {
        if (value.remaining < json[value.item_name].serial_no.length) {
          this.getMessage(`Item ${value.item_name} has
          ${value.remaining} remaining, but provided
          ${json[value.item_name].serial_no.length} serials.`);
          isValid = false;
          break;
        }
      }
    }
    return isValid;
  }

  getMessage(notFoundMessage, expected?, found?) {
    return this.snackBar.open(
      expected && found
        ? `${notFoundMessage}, expected ${expected} found ${found}`
        : `${notFoundMessage}`,
      CLOSE,
      { verticalPosition: 'top', duration: 2500 },
    );
  }

  addSerialsFromCsvJson(csvJsonObj: CsvJsonObj | any) {
    const data = this.itemDataSource.data();
    data.some(element => {
      if (csvJsonObj[element.item_name]) {
        if (!element.has_serial_no) {
          this.snackBar.open(
            `${element.item_name} is a non-serial item.`,
            CLOSE,
            { duration: 3500 },
          );
          return true;
        }
        this.assignRangeSerial(
          element,
          csvJsonObj[element.item_name].serial_no,
        );
        return false;
      }
    });
  }
}
