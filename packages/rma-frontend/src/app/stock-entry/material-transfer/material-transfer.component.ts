import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Location } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
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
import { DEFAULT_COMPANY } from '../../constants/storage';
import { TimeService } from '../../api/time/time.service';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';

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
  warehouseState = {
    s_warehouse: new FormControl(''),
    t_warehouse: new FormControl(''),
  };
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

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly location: Location,
    private readonly salesService: SalesService,
    private readonly timeService: TimeService,
    private readonly stockEntryService: StockEntryService,
  ) {
    this.onFromRange(this.value);
    this.onToRange(this.value);
  }

  async ngOnInit() {
    this.company = await this.salesService.getStore().getItem(DEFAULT_COMPANY);
    this.materialTransferDataSource = new MaterialTransferDataSource();
    this.filteredWarehouseList1 = this.warehouseState.s_warehouse.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const filter = `[["name","like","%${value}%"],["company","=","${this.company}"]]`;
        return this.salesService.getWarehouseList(value, filter);
      }),
    );

    this.filteredWarehouseList2 = this.warehouseState.t_warehouse.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const filter = `[["name","like","%${value}%"],["company","=","${this.company}"]]`;
        return this.salesService.getWarehouseList(value, filter);
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
      this.getSerialsFromRange(
        fromRange || this.rangePickerState.fromRange || 0,
        toRange || this.rangePickerState.toRange || 0,
      ) || [];
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

  deleteRow(row, i) {
    let materialTransferData = this.materialTransferDataSource.data();
    materialTransferData.length === 1
      ? (materialTransferData = [])
      : materialTransferData.splice(i, 1);
    this.materialTransferDataSource.update(materialTransferData);
  }

  addRow() {
    if (!this.validateMaterialTransferData()) return;

    this.salesService.getSerial(this.rangePickerState.serials[0]).subscribe({
      next: (success: { item: { item_code: string; item_name: string } }[]) => {
        const materialTransferData = this.materialTransferDataSource.data();
        const materialTransferRow = new StockEntryRow();
        materialTransferRow.s_warehouse = this.warehouseState.s_warehouse.value;
        materialTransferRow.t_warehouse = this.warehouseState.t_warehouse.value;
        materialTransferRow.item_code = success[0].item.item_code;
        materialTransferRow.item_name = success[0].item.item_name;
        materialTransferRow.qty = this.rangePickerState.serials.length;
        materialTransferRow.serial_no = this.rangePickerState.serials;
        this.resetRangeState();
        materialTransferData.push(materialTransferRow);
        this.materialTransferDataSource.update(materialTransferData);
      },
      error: err => {
        this.getMessage("Provided serial doesn't exist.");
      },
    });
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
    body.items = this.materialTransferDataSource.data();
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
    if (
      !this.warehouseState.s_warehouse.value ||
      !this.warehouseState.t_warehouse.value
    ) {
      this.getMessage('Please select source and target warehouse.');
      return false;
    }

    if (!this.rangePickerState.serials[0]) {
      this.getMessage('Please select a serial range.');
      return false;
    }
    return true;
  }

  isNumber(number) {
    return !isNaN(parseFloat(number)) && isFinite(number);
  }

  getSerialsInputValue(row) {
    return row.serial_no.length === 1
      ? row.serial_no[0]
      : `${row.serial_no[0]} - ${row.serial_no[row.serial_no.length - 1]}`;
  }

  getMessage(notFoundMessage, expected?, found?) {
    return this.snackBar.open(notFoundMessage, CLOSE, { duration: 4500 });
    //   return this.snackBar.open(
    //     expected && found
    //       ? `${notFoundMessage}, expected ${expected} found ${found}`
    //       : `${notFoundMessage}`,
    //     CLOSE,
    //     { verticalPosition: 'top', duration: 2500 },
    //   );
  }

  getPaddedNumber(num, numberLength) {
    return _.padStart(num, numberLength, '0');
  }

  getSerialPrefix(startSerial, endSerial) {
    try {
      const serialStartNumber = startSerial.match(/\d+/g);
      const serialEndNumber = endSerial.match(/\d+/g);
      let serialPadding = serialEndNumber[serialEndNumber?.length - 1]?.length;
      if (
        serialStartNumber[serialStartNumber?.length - 1]?.length >
        serialEndNumber[serialEndNumber?.length - 1]?.length
      ) {
        serialPadding =
          serialStartNumber[serialStartNumber?.length - 1]?.length;
      }
      let start = Number(
        serialStartNumber[serialStartNumber.length - 1].match(/\d+/g),
      );
      let end = Number(
        serialEndNumber[serialEndNumber.length - 1].match(/\d+/g),
      );
      const prefix = this.getStringPrefix([startSerial, endSerial]).replace(
        /\d+$/,
        '',
      );
      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }
      return { start, end, prefix, serialPadding };
    } catch {
      return { start: 0, end: 0, prefix: '' };
    }
  }

  getStringPrefix(arr1: string[]) {
    const arr = arr1.concat().sort(),
      a1 = arr[0],
      a2 = arr[arr.length - 1],
      L = a1.length;
    let i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
    return a1.substring(0, i);
  }
}
