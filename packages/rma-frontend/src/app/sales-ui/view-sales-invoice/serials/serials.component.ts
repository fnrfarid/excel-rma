import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { DEFAULT_COMPANY } from '../../../constants/storage';
import { SalesService } from '../../services/sales.service';
import {
  ERROR_FETCHING_SALES_INVOICE,
  SERIAL_ASSIGNED,
} from '../../../constants/messages';
import { CLOSE } from '../../../constants/app-string';
import { FormControl } from '@angular/forms';
import { Observable, from, of } from 'rxjs';
import { startWith, switchMap, mergeMap, map } from 'rxjs/operators';
import { SalesInvoiceDetails } from '../details/details.component';
import {
  SerialAssign,
  SerialNo,
} from '../../../common/interfaces/sales.interface';
import { Location } from '@angular/common';

@Component({
  selector: 'sales-invoice-serials',
  templateUrl: './serials.component.html',
  styleUrls: ['./serials.component.scss'],
})
export class SerialsComponent implements OnInit {
  csvFile: any;
  displayedColumns: string[] = [
    'position',
    'serial',
    'item',
    'company',
    'supplier',
    'claimsReceivedDate',
    'clear',
  ];
  dataSource = [];
  date = new FormControl(new Date());
  claimsReceivedDate: string;
  warehouseFormControl = new FormControl();
  filteredWarehouseList: Observable<any[]>;
  salesInvoiceDetails: SalesInvoiceDetails;

  constructor(
    private readonly snackbar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly salesService: SalesService,
    private readonly location: Location,
  ) {}

  ngOnInit() {
    // this.claimsDateFormControl = new FormControl(new Date().toString());
    this.claimsReceivedDate = this.getParsedDate(this.date.value);
    this.getSalesInvoice(this.route.snapshot.params.invoiceUuid);
    this.filteredWarehouseList = this.warehouseFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getWarehouseList(value);
      }),
    );
  }

  getSalesInvoice(uuid: string) {
    from(this.salesService.getStore().getItem(DEFAULT_COMPANY))
      .pipe(
        switchMap(company => {
          let i = 0;
          return this.salesService.getSalesInvoice(uuid).pipe(
            switchMap(success => {
              this.salesInvoiceDetails = success as SalesInvoiceDetails;
              return from(this.salesInvoiceDetails.items);
            }),
            map(item => {
              i++;
              return item;
            }),
            mergeMap(item => {
              const itemList = [];
              for (let j = 0; j < item.qty; j++) {
                itemList.push({
                  position: i,
                  serial_no: '',
                  item: item.item_name,
                  company,
                  claimsReceivedDate: this.claimsReceivedDate,
                  rate: item.rate,
                  qty: 1,
                  amount: item.rate,
                  item_code: item.item_code,
                });
                i++;
              }
              return of(itemList);
            }),
          );
        }),
      )
      .subscribe({
        next: itemList => {
          // this.salesInvoiceDetails = success;
          // this.salesInvoiceDetails.address_display = this.salesInvoiceDetails
          //   .address_display
          //   ? this.salesInvoiceDetails.address_display.replace(/<br>/g, '\n')
          //   : undefined;
          // this.dataSource = success.items;

          this.dataSource = itemList;
        },
        error: err => {
          this.snackbar.open(
            err.error.message
              ? err.error.message
              : `${ERROR_FETCHING_SALES_INVOICE}${err.error.error}`,
            CLOSE,
            { duration: 2500 },
          );
        },
      });
  }

  updateSerial(element, serial_no) {
    if (serial_no) {
      const index = this.dataSource.indexOf(element);
      this.dataSource[index].serial_no = serial_no;
      this.salesService.getSerial(serial_no).subscribe({
        next: res => {
          if (res[0].item_code === element.item_code)
            this.dataSource[index].supplier = res[0].supplier.supplier_name;
          else {
            this.snackbar.open(
              'Serial Number is not assignable on current Item.',
              CLOSE,
              {
                duration: 2500,
              },
            );
            this.dataSource[index].serial_no = '';
            this.dataSource[index].supplier = '';
          }
        },
        error: err => {
          this.dataSource[index].serial_no = '';
          this.dataSource[index].supplier = '';
          this.snackbar.open('Invalid Serial No ', CLOSE, {
            duration: 2500,
          });
        },
      });
    }
  }

  clearRow(element) {
    const index = this.dataSource.indexOf(element);
    this.dataSource[index].serial_no = '';
    this.dataSource[index].supplier = '';
  }

  submitDeliveryNote() {
    const assignSerial = {} as SerialAssign;
    assignSerial.company = this.salesInvoiceDetails.company;
    assignSerial.customer = this.salesInvoiceDetails.customer;
    assignSerial.posting_date = this.salesInvoiceDetails.posting_date;
    assignSerial.posting_time = this.salesInvoiceDetails.posting_time;
    assignSerial.sales_invoice_name = this.salesInvoiceDetails.name;
    assignSerial.set_warehouse = this.warehouseFormControl.value;
    assignSerial.total = 0;
    assignSerial.total_qty = 0;
    assignSerial.items = [];

    const filteredItemCodeList = [
      ...new Set(this.dataSource.map(item => item.item_code)),
    ];

    filteredItemCodeList.forEach(item_code => {
      const serialItem = {} as SerialItem;
      serialItem.serial_no = [];
      serialItem.qty = 0;
      serialItem.amount = 0;
      serialItem.rate = 0;
      serialItem.item_code = item_code;
      this.dataSource.forEach(item => {
        if (item_code === item.item_code && item.serial_no !== '') {
          serialItem.qty += 1;
          serialItem.amount += item.rate;
          serialItem.serial_no.push(item.serial_no);
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
          this.snackbar.open(SERIAL_ASSIGNED, CLOSE, {
            duration: 2500,
          });
          this.location.back();
        },
        error: err => {
          if (err.status === 406) {
            const errMessage = err.error.message.split('\\n');
            this.snackbar.open(
              errMessage[errMessage.length - 2].split(':')[1],
              CLOSE,
              {
                duration: 2500,
              },
            );
            return;
          }
          this.snackbar.open(err.error.message, CLOSE, {
            duration: 2500,
          });
        },
      });
    } else {
      this.snackbar.open('Error : Duplicate Serial number assigned.', CLOSE, {
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

  fileChangedEvent($event): void {
    const reader = new FileReader();
    reader.readAsText($event.target.files[0]);
    reader.onload = (file: any) => {
      this.csvFile = file.target.result;
      this.populateTable();
    };
  }

  claimsDate($event) {
    this.claimsReceivedDate = this.getParsedDate($event.value);
    this.dataSource.forEach((item, index) => {
      this.dataSource[index].claimsReceivedDate = this.claimsReceivedDate;
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

  populateTable() {
    if (!this.csvFile) return;
    this.dataSource = [];
    const data = this.csvJSON();
    let i = 0;
    data.forEach((element: { model: string; serial: string }) => {
      this.dataSource.push({
        position: i,
        serial: element.serial,
        item: element.model,
        company: localStorage.getItem(DEFAULT_COMPANY),
        // supplier: this.supplier,
        claimsReceivedDate: this.claimsReceivedDate,
      });
      i++;
    });
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
  qty: number;
  rate: number;
  amount: number;
  serial_no: string[];
}
