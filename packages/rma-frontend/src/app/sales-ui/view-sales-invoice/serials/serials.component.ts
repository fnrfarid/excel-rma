import { Component, OnInit, Inject } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { FormControl, Validators } from '@angular/forms';

import { Observable, Subject } from 'rxjs';
import {
  startWith,
  switchMap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import {
  MatSnackBar,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material';
import { CLOSE } from '../../../constants/app-string';
import {
  ERROR_FETCHING_SALES_INVOICE,
  SERIAL_ASSIGNED,
} from '../../../constants/messages';
import { SalesInvoiceDetails } from '../details/details.component';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { SerialDataSource, ItemDataSource } from './serials-datasource';
import {
  SerialAssign,
  SerialNo,
} from 'src/app/common/interfaces/sales.interface';
import { Location } from '@angular/common';

@Component({
  selector: 'sales-invoice-serials',
  templateUrl: './serials.component.html',
  styleUrls: ['./serials.component.scss'],
})
export class SerialsComponent implements OnInit {
  csvFile: any;
  value: string;
  date = new FormControl(new Date());
  claimsReceivedDate: string;

  warehouseFormControl = new FormControl('', [Validators.required]);

  filteredWarehouseList: Observable<any[]>;
  getOptionText = '';
  salesInvoiceDetails: SalesInvoiceDetails;

  rangePickerState = {
    prefix: '',
    fromRange: 0,
    toRange: 0,
    serials: [],
  };

  fromRangeUpdate = new Subject<string>();
  toRangeUpdate = new Subject<string>();
  itemDisplayedColumns = [
    'item_code',
    'item_name',
    'qty',
    'assigned',
    'remaining',
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

  constructor(
    private readonly salesService: SalesService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private location: Location,
  ) {
    this.onFromRange(this.value);
    this.onToRange(this.value);
  }

  ngOnInit() {
    this.serialDataSource = new SerialDataSource();
    this.itemDataSource = new ItemDataSource();
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
        this.generateSerials(value);
      });
  }

  onToRange(value) {
    this.toRangeUpdate
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(v => {
        this.generateSerials(undefined, value);
      });
  }

  onPrefixChange(value) {
    this.generateSerials(undefined, undefined, value);
  }

  async generateSerials(fromRange?, toRange?, prefix?) {
    this.rangePickerState.serials =
      (await this.getSerialsFromRange(
        fromRange || this.rangePickerState.fromRange || 0,
        toRange || this.rangePickerState.toRange || 0,
        prefix || this.rangePickerState.prefix,
      )) || [];
  }

  getSerialsFromRange(start: number, end: number, prefix: string) {
    const data: any[] = _.range(
      start > end ? Number(start) + 1 : start,
      end > start ? Number(end) + 1 : end,
    );
    const maxSerial =
      start.toString().length > end.toString().length
        ? start.toString().length
        : end.toString().length;
    for (let i = 0; i < data.length; i++) {
      data[i] = `${prefix}${this.getPaddedNumber(data[i], maxSerial)}`;
    }
    return data;
  }

  getPaddedNumber(num, numberLength) {
    return _.padStart(num, numberLength, '0');
  }

  getSalesInvoice(uuid: string) {
    return this.salesService.getSalesInvoice(uuid).subscribe({
      next: (itemList: SalesInvoiceDetails) => {
        this.salesInvoiceDetails = itemList as SalesInvoiceDetails;
        this.itemDataSource.loadItems(
          itemList.items.filter(item => {
            item.assigned = 0;
            item.remaining = item.qty;
            return item;
          }),
        );
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

  assignRangeSerial(row: Item) {
    const data = this.serialDataSource.data();
    data.push({
      item_code: row.item_code,
      item_name: row.item_name,
      qty: this.rangePickerState.serials.length,
      rate: row.rate,
      amount: row.amount,
      serial_no: this.rangePickerState.serials,
    });
    this.updateProductState(
      row.item_code,
      this.rangePickerState.serials.length,
    );
    this.serialDataSource.update(data);
    this.resetRangeState();
  }

  assignSerial(itemRow: Item) {
    if (!this.rangePickerState.serials.length) {
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

  validateSerial(item: { item_code: string; serials: string[] }, row: Item) {
    this.salesService.validateSerials(item).subscribe({
      next: (success: { notFoundSerials: string[] }) => {
        success.notFoundSerials && success.notFoundSerials.length
          ? this.snackBar.open(
              `Invalid Serials ${success.notFoundSerials
                .splice(0, 5)
                .join(', ')}...`,
              CLOSE,
              { duration: 2500 },
            )
          : this.assignRangeSerial(row);
      },
      error: err => {},
    });
  }

  addSingularSerials(row, serialCount) {
    this.updateProductState(row.item_code, serialCount);
    const serials = this.serialDataSource.data();
    Array.from({ length: serialCount }, (x, i) => {
      serials.push({
        item_code: row.item_code,
        item_name: row.item_name,
        qty: 1,
        rate: row.rate,
        amount: row.amount,
        serial_no: [''],
      });
    });
    this.serialDataSource.update(serials);
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

  submitDeliveryNote() {
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
        if (item_code === item.item_code && item.serial_no[0] !== '') {
          serialItem.qty += 1;
          serialItem.amount += item.rate;
          serialItem.serial_no.push(item.serial_no[0]);
          serialItem.rate = item.rate;
        }
      });
      assignSerial.total += serialItem.amount;
      assignSerial.total_qty += serialItem.qty;
      assignSerial.items.push(serialItem);
    });

    if (this.validateSerials(assignSerial.items)) {
      this.salesService.assignSerials(assignSerial).subscribe({
        next: success => {
          this.snackBar.open(SERIAL_ASSIGNED, CLOSE, {
            duration: 2500,
          });
          this.location.back();
        },
        error: err => {
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
      fromRange: 0,
      toRange: 0,
      serials: [],
    };
  }

  getFrappeTime() {
    const date = new Date();
    return [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
  }

  fileChangedEvent($event): void {
    const reader = new FileReader();
    reader.readAsText($event.target.files[0]);
    reader.onload = (file: any) => {
      this.csvFile = file.target.result;
    };
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

  csvJSON() {
    // don't try to optimize or work with this code this will fail to convert csv which have hidden characters such as ",; simply use
    // csvjson-csv2json library run the snippet npm i csvjson-csv2json
    // use it like CSVTOJSON.csv2json(YOUR_CSV_STRING, { parseNumbers: true });
    const lines = this.csvFile.split('\n');
    const result = [];
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const obj = {};
      const currentline = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }
      result.push(obj);
    }
    return result;
  }
}

export interface SerialItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  serial_no: string[];
}

export interface Item {
  item_name: string;
  item_code: string;
  qty: number;
  assigned: number;
  remaining: number;
  rate?: number;
  amount?: number;
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
