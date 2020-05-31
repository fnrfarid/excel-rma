import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { FormControl, Validators } from '@angular/forms';

import { Observable, Subject, of, from } from 'rxjs';
import {
  startWith,
  switchMap,
  debounceTime,
  distinctUntilChanged,
  mergeMap,
  toArray,
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { CLOSE, DELIVERY_NOTE } from '../../../constants/app-string';
import {
  ERROR_FETCHING_SALES_INVOICE,
  SERIAL_ASSIGNED,
} from '../../../constants/messages';
import { SalesInvoiceDetails } from '../details/details.component';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import {
  SerialDataSource,
  ItemDataSource,
  DeliveredSerialsDataSource,
} from './serials-datasource';
import {
  SerialAssign,
  SerialNo,
} from '../../../common/interfaces/sales.interface';
import { Location } from '@angular/common';
import { CsvJsonService } from '../../../api/csv-json/csv-json.service';
import { LoadingController } from '@ionic/angular';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../constants/date-format';
import { TimeService } from '../../../api/time/time.service';
import { SerialsService } from '../../../common/helpers/serials/serials.service';

@Component({
  selector: 'sales-invoice-serials',
  templateUrl: './serials.component.html',
  styleUrls: ['./serials.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class SerialsComponent implements OnInit {
  @ViewChild('csvFileInput', { static: false })
  csvFileInput: ElementRef;

  xlsxData: any;
  value: string;
  date = new FormControl(new Date());
  claimsReceivedDate: string;

  warehouseFormControl = new FormControl('', [Validators.required]);

  filteredWarehouseList: Observable<any[]>;
  getOptionText = '';
  salesInvoiceDetails: SalesInvoiceDetails;

  rangePickerState = {
    prefix: '',
    fromRange: '',
    toRange: '',
    serials: [],
  };

  DEFAULT_SERIAL_RANGE = { start: 0, end: 0, prefix: '', serialPadding: 0 };
  filteredItemList = [];
  fromRangeUpdate = new Subject<string>();
  toRangeUpdate = new Subject<string>();
  itemDisplayedColumns = [
    'item_name',
    'qty',
    'assigned',
    'remaining',
    'has_serial_no',
    'salesWarrantyMonths',
    'add_serial',
  ];
  itemDataSource: ItemDataSource;
  serialDisplayedColumns = [
    'item_name',
    'qty',
    'warranty_date',
    'serial_no',
    'delete',
  ];
  materialTransferDisplayedColumns = [
    's_warehouse',
    't_warehouse',
    'item_code',
    'item_name',
    'qty',
    'amount',
    'serial_no',
  ];
  serialDataSource: SerialDataSource;

  deliveredSerialsDataSource: DeliveredSerialsDataSource;
  deliveredSerialsDisplayedColumns = [
    'sr_no',
    'item_name',
    'warehouse',
    'sales_warranty_period',
    'sales_warranty_expiry',
    'serial_no',
  ];
  deliveredSerialsSearch: string = '';
  disableDeliveredSerialsCard: boolean = false;
  remaining: number = 0;
  index: number = 0;
  size: number = 10;
  itemMap: any = {};

  constructor(
    private readonly salesService: SalesService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private location: Location,
    private readonly timeService: TimeService,
    private readonly csvService: CsvJsonService,
    private readonly loadingController: LoadingController,
    private readonly serialService: SerialsService,
  ) {
    this.onFromRange(this.value);
    this.onToRange(this.value);
  }

  ngOnInit() {
    this.serialDataSource = new SerialDataSource();
    this.itemDataSource = new ItemDataSource();
    this.deliveredSerialsDataSource = new DeliveredSerialsDataSource(
      this.salesService,
    );
    this.getSalesInvoice(this.route.snapshot.params.invoiceUuid);
    this.filteredWarehouseList = this.warehouseFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getWarehouseList(value);
      }),
    );
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

  getFilteredItems(salesInvoice: SalesInvoiceDetails) {
    const filteredItemList = [];
    let remaining = 0;
    salesInvoice.items.forEach(item => {
      this.itemMap[item.item_code] = item;
      item.assigned = 0;
      item.remaining = item.qty;
      if (salesInvoice.delivered_items_map[item.item_code]) {
        item.assigned = salesInvoice.delivered_items_map[item.item_code] || 0;
        item.remaining =
          item.qty - salesInvoice.delivered_items_map[item.item_code];
      }
      remaining += item.remaining;
      filteredItemList.push(item);
    });
    this.remaining = remaining;
    return filteredItemList;
  }

  getItemsWarranty() {
    from(this.itemDataSource.data())
      .pipe(
        mergeMap(item => {
          return this.salesService.getItemFromRMAServer(item.item_code).pipe(
            switchMap(warrantyItem => {
              item.salesWarrantyMonths = warrantyItem.salesWarrantyMonths;
              return of(item);
            }),
          );
        }),
        toArray(),
      )
      .subscribe({
        next: success => {
          success.forEach(item => {
            this.itemMap[item.item_code].salesWarrantyMonths =
              item.salesWarrantyMonths;
          });
          this.itemDataSource.loadItems(success);
        },
        error: err => {},
      });
  }

  getSalesInvoice(uuid: string) {
    return this.salesService.getSalesInvoice(uuid).subscribe({
      next: (sales_invoice: SalesInvoiceDetails) => {
        if (sales_invoice.delivery_note_items) {
          this.getDeliveredSerials(sales_invoice.uuid);
        }
        this.salesInvoiceDetails = sales_invoice as SalesInvoiceDetails;
        this.disableDeliveredSerialsCard =
          Object.keys(this.salesInvoiceDetails.delivered_items_map).length === 0
            ? true
            : false;
        this.filteredItemList = this.getFilteredItems(sales_invoice);
        this.itemDataSource.loadItems(this.filteredItemList);
        this.warehouseFormControl.setValue(sales_invoice.delivery_warehouse);
        this.getItemsWarranty();
      },
      error: err => {
        this.snackBar.open(
          err.error.message
            ? err.error.message
            : `${ERROR_FETCHING_SALES_INVOICE}${err.error.error}`,
          CLOSE,
          { duration: 2500 },
        );
      },
    });
  }

  getDeliveredSerials(uuid) {
    this.deliveredSerialsDataSource.loadItems(
      uuid,
      this.deliveredSerialsSearch,
      this.index,
      this.size,
    );
  }

  getUpdate(event) {
    this.index = event.pageIndex;
    this.size = event.pageSize;
    this.deliveredSerialsDataSource.loadItems(
      this.salesInvoiceDetails.uuid,
      this.deliveredSerialsSearch,
      this.index,
      this.size,
    );
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
    if (serials && serials <= row.remaining) {
      this.addSingularSerials(row, serials);
      this.resetRangeState();
      this.updateProductState(row, serials);
      return;
    }
    this.snackBar.open('Please select a valid number of rows.', CLOSE, {
      duration: 2500,
    });
  }

  async assignRangeSerial(row: Item, serials: string[]) {
    const data = this.serialDataSource.data();
    data.push({
      item_code: row.item_code,
      item_name: row.item_name,
      qty: serials.length,
      rate: row.rate,
      has_serial_no: row.has_serial_no,
      warranty_date: await this.getWarrantyDate(row.salesWarrantyMonths),
      amount: row.amount,
      serial_no: serials,
    });
    this.updateProductState(row.item_code, serials.length);
    this.serialDataSource.update(data);
    this.resetRangeState();
  }

  setFilter(event?) {
    this.getDeliveredSerials(this.salesInvoiceDetails.uuid);
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
        warranty_date: await this.getWarrantyDate(row.salesWarrantyMonths),
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

  validateSerial(
    item: { item_code: string; serials: string[]; warehouse?: string },
    row: Item,
  ) {
    if (!this.warehouseFormControl.value) {
      this.getMessage('Please select a warehouse to validate serials.');
      return;
    }
    item.warehouse = this.warehouseFormControl.value;
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

  addSingularSerials(row, serialCount) {
    this.updateProductState(row.item_code, serialCount);
    const serials = this.serialDataSource.data();
    Array.from({ length: serialCount }, async (x, i) => {
      serials.push({
        item_code: row.item_code,
        item_name: row.item_name,
        qty: 1,
        has_serial_no: row.has_serial_no,
        warranty_date: await this.getWarrantyDate(row.salesWarrantyMonths),
        rate: row.rate,
        amount: row.amount,
        serial_no: [''],
      });
      this.serialDataSource.update(serials);
    });
  }

  async getWarrantyDate(salesWarrantyMonths: number) {
    let date = new Date();
    let dateTime;
    if (salesWarrantyMonths) {
      try {
        date = new Date(date.setMonth(date.getMonth() + salesWarrantyMonths));
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
    const itemData = this.itemDataSource.data();

    itemData.filter(item => {
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

  async submitDeliveryNote() {
    if (!this.validateState()) return;

    const loading = await this.loadingController.create({
      message: 'Creating Delivery Note..',
    });
    await loading.present();
    const assignSerial = {} as SerialAssign;
    assignSerial.company = this.salesInvoiceDetails.company;
    assignSerial.customer = this.salesInvoiceDetails.customer;
    assignSerial.posting_date = this.getParsedDate(this.date.value);
    assignSerial.posting_time = this.getFrappeTime();
    assignSerial.sales_invoice_name = this.salesInvoiceDetails.name;
    assignSerial.set_warehouse = this.warehouseFormControl.value;
    assignSerial.total = 0;
    assignSerial.total_qty = 0;
    assignSerial.items = [];

    const filteredItemCodeList = [
      ...new Set(this.serialDataSource.data().map(item => item.item_code)),
    ];

    filteredItemCodeList.forEach(item_code => {
      const serialItem = {} as SerialItem;
      serialItem.serial_no = [];
      serialItem.qty = 0;
      serialItem.amount = 0;
      serialItem.rate = 0;
      serialItem.item_code = item_code;
      this.serialDataSource.data().forEach(item => {
        if (item_code === item.item_code && item.serial_no) {
          serialItem.rate = item.rate;
          serialItem.qty += item.qty;
          serialItem.has_serial_no = item.has_serial_no;
          serialItem.amount += item.qty * item.rate;
          serialItem.warranty_date = item.warranty_date;
          serialItem.serial_no.push(...item.serial_no);
          serialItem.against_sales_invoice = this.salesInvoiceDetails.name;
        }
      });

      assignSerial.total += serialItem.amount;
      assignSerial.total_qty += serialItem.qty;
      assignSerial.items.push(serialItem);
    });

    if (this.validateSerials(assignSerial.items)) {
      this.salesService.assignSerials(assignSerial).subscribe({
        next: success => {
          loading.dismiss();
          this.snackBar.open(SERIAL_ASSIGNED, CLOSE, {
            duration: 2500,
          });
          this.location.back();
        },
        error: err => {
          loading.dismiss();
          if (err.status === 406) {
            const errMessage = err.error.message.split('\\n');
            this.snackBar.open(
              errMessage[errMessage.length - 2].split(':')[1],
              CLOSE,
              {
                duration: 2500,
              },
            );
            return;
          }
          this.snackBar.open(err.error.message, CLOSE, {
            duration: 2500,
          });
        },
      });
    } else {
      loading.dismiss();
      this.snackBar.open('Error : Duplicate Serial number assigned.', CLOSE, {
        duration: 2500,
      });
    }
  }

  validateSerials(itemList: SerialNo[]) {
    const serials = [];
    itemList.forEach(item => {
      item.serial_no.forEach(serial => {
        serials.push(serial);
      });
    });
    const filteredSerials = [...new Set(serials)];
    if (filteredSerials.length === serials.length) return true;
    return false;
  }

  resetRangeState() {
    this.rangePickerState = {
      prefix: '',
      fromRange: '',
      toRange: '',
      serials: [],
    };
  }

  getFrappeTime() {
    const date = new Date();
    return [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
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
                if (!this.warehouseFormControl.value) {
                  this.getMessage(
                    'Please select a warehouse to validate serials.',
                  );
                  return;
                }
                return this.csvService
                  .validateSerials(
                    item_names,
                    hashMap,
                    DELIVERY_NOTE,
                    this.warehouseFormControl.value,
                  )
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

  getMessage(notFoundMessage, expected?, found?) {
    return this.snackBar.open(
      expected && found
        ? `${notFoundMessage}, expected ${expected} found ${found}`
        : `${notFoundMessage}`,
      CLOSE,
      { duration: 4500 },
    );
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

  getParsedDate(value) {
    const date = new Date(value);
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      // +1 as index of months start's from 0
      date.getDate(),
    ].join('-');
  }
}

export interface CsvJsonObj {
  [key: string]: {
    serial_no: string[];
  };
}
export interface SerialItem {
  item_code: string;
  item_name: string;
  qty: number;
  has_serial_no: number;
  warranty_date?: any;
  rate: number;
  amount: number;
  serial_no: string[];
  against_sales_invoice?: string;
}

export interface Item {
  item_name: string;
  item_code: string;
  qty: number;
  assigned: number;
  has_serial_no: number;
  remaining: number;
  rate?: number;
  amount?: number;
  salesWarrantyMonths?: number;
  purchaseWarrantyMonths?: number;
}

@Component({
  selector: 'assign-serials-dialog',
  templateUrl: 'assign-serials-dialog.html',
})
export class AssignSerialsDialog {
  constructor(
    public dialogRef: MatDialogRef<AssignSerialsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'assign-non-serials-item-dialog',
  templateUrl: 'assign-non-serials-item-dialog.html',
})
export class AssignNonSerialsItemDialog {
  constructor(
    public dialogRef: MatDialogRef<AssignNonSerialsItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
}
