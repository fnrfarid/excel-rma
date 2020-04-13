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
import { CLOSE, PURCHASE_RECEIPT } from '../../../constants/app-string';
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

  DEFAULT_SERIAL_RANGE = { start: 0, end: 0, prefix: '', serialPadding: 0 };
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
        return this.salesService.getWarehouseList(value);
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
        if (this.displayDeliveredSerialsTable) {
          this.getDeliveredSerials();
        }
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
      this.purchaseInvoiceDetails.purchase_receipt_names,
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
      this.purchaseInvoiceDetails.purchase_receipt_names,
      this.deliveredSerialsSearch,
      this.index,
      this.size,
    );
  }

  async submitPurchaseReceipt() {
    if (!this.warehouseFormControl.value) {
      this.snackBar.open('Please select a warehouse.', CLOSE, {
        duration: 200,
      });
      return;
    }
    const loading = await this.loadingController.create({
      message: 'Creating Serials...!',
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
        this.snackBar.open('Purchase Receipt created', CLOSE, {
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
      this.getSerialsFromRange(
        fromRange || this.rangePickerState.fromRange || 0,
        toRange || this.rangePickerState.toRange || 0,
      ) || [];
  }

  isNumber(number) {
    return !isNaN(parseFloat(number)) && isFinite(number);
  }

  getSerialsFromRange(startSerial: string, endSerial: string) {
    const { start, end, prefix, serialPadding } = this.getSerialPrefix(
      startSerial,
      endSerial,
    );
    if (!this.isNumber(start) || !this.isNumber(end)) {
      this.getMessage(
        'Invalid serial range, end should be a number found character',
      );
      return [];
    }

    if (!prefix || prefix.length === 0) {
      return [];
    }

    const data: any[] = _.range(start, end + 1);
    let i = 0;
    for (const value of data) {
      if (value) {
        data[i] = `${prefix}${this.getPaddedNumber(value, serialPadding)}`;
        i++;
      }
    }
    return data;
  }

  getSerialPrefix(startSerial, endSerial) {
    if (!startSerial || !endSerial) {
      return this.DEFAULT_SERIAL_RANGE;
    }

    if (startSerial.length !== endSerial.length) {
      this.getMessage('Length for From Range and To Range should be the same.');
      return this.DEFAULT_SERIAL_RANGE;
    }

    try {
      const prefix = this.getStringPrefix([startSerial, endSerial]);

      if (!prefix) {
        this.getMessage('Invalid serial prefix, please enter valid serials');
        return this.DEFAULT_SERIAL_RANGE;
      }

      const serialStartNumber = startSerial.match(/\d+/g);
      const serialEndNumber = endSerial.match(/\d+/g);
      const serialPadding =
        serialEndNumber[serialEndNumber?.length - 1]?.length;

      let start = Number(
        serialStartNumber[serialStartNumber.length - 1].match(/\d+/g),
      );

      let end = Number(
        serialEndNumber[serialEndNumber.length - 1].match(/\d+/g),
      );

      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }
      return { start, end, prefix, serialPadding };
    } catch {
      return this.DEFAULT_SERIAL_RANGE;
    }
  }

  getStringPrefix(arr1: string[]) {
    const arr = arr1.concat().sort(),
      fromRange = arr[0],
      toRange = arr[1],
      L = fromRange.length;
    let i = 0;
    while (i < L && fromRange.charAt(i) === toRange.charAt(i)) i++;
    const prefix = fromRange.substring(0, i).replace(/\d+$/, '');

    const fromRangePostFix = fromRange.replace(prefix, '');
    const toRangePostFix = toRange.replace(prefix, '');

    if (!/^\d+$/.test(fromRangePostFix) || !/^\d+$/.test(toRangePostFix)) {
      return false;
    }
    return prefix;
  }

  getPaddedNumber(num, numberLength) {
    return _.padStart(num, numberLength, '0');
  }

  async assignSingularSerials(row: Item) {
    const dialogRef =
      row.remaining >= 30
        ? this.dialog.open(AssignSerialsDialog, {
            width: '250px',
            data: { serials: row.remaining || 0 },
          })
        : null;

    const serials =
      row.remaining >= 30
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

  async getWarrantyDate(purchaseWarrantyMonths: number) {
    let date = new Date();
    date = new Date(date.setMonth(date.getMonth() + purchaseWarrantyMonths));
    const dateTime = await this.timeService.getDateAndTime(date);
    return dateTime.date;
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
      date.getFullYear(),
      date.getMonth() + 1,
      // +1 as index of months start's from 0
      date.getDate(),
    ].join('-');
  }

  fileChangedEvent($event): void {
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
      this.csvService.validateHeaders(headers)
        ? // if valid convert to json.
          this.csvService
            .csvToJSON(csvData)
            .pipe(
              switchMap(json => {
                // club json data to item_name as unique { blue cotton candy : { serials : [1,2,3..]}, ...  }
                const data = this.csvService.mapJson(json);
                // name of all items [ "blue cotton candy" ...]
                const item_names = [];
                // obj map for item and number of serial present like - { blue cotton candy : 50  }
                const itemObj: CsvJsonObj = {};

                // get all item_name and validate from current remaining items and then the API
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

                // validate Json serials with remaining products to be assigned.
                return this.validateJson(itemObj)
                  ? // if valid ping backend to validate found serials
                    this.csvService
                      .validateSerials(item_names, itemObj, PURCHASE_RECEIPT)
                      .pipe(
                        switchMap((response: boolean) => {
                          this.csvFileInput.nativeElement.value = '';
                          if (response) {
                            return of(itemObj);
                          }
                          return of(false);
                        }),
                      )
                  : of(false);
              }),
            )
            .subscribe({
              next: (response: CsvJsonObj | boolean) => {
                response ? this.addSerialsFromCsvJson(response) : null;
                // reset file input, restart the flow.
                this.csvFileInput.nativeElement.value = '';
              },
              error: err => {
                this.csvFileInput.nativeElement.value = '';
              },
            })
        : (this.csvFileInput.nativeElement.value = '');
    };
  }

  validateJson(json: CsvJsonObj) {
    let isValid = true;
    const data = this.itemDataSource.data();
    for (const value of data) {
      if (json[value.item_name]) {
        if (value.remaining < json[value.item_name].serial) {
          this.getMessage(`Item ${value.item_name} has
          ${value.remaining} remaining, but provided
          ${json[value.item_name].serial} serials.`);
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
            `${element.item_name} is not a non-serial item.`,
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
