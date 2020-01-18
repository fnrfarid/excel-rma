import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { DEFAULT_COMPANY } from '../../../constants/storage';
import { SalesService } from '../../services/sales.service';
import { ERROR_FETCHING_SALES_INVOICE } from '../../../constants/messages';
import { CLOSE } from '../../../constants/app-string';
import { FormControl } from '@angular/forms';

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
  ];
  dataSource = [];
  date = new FormControl(new Date());
  claimsReceivedDate: string;
  constructor(
    private readonly snackbar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly salesService: SalesService,
  ) {}

  ngOnInit() {
    // this.claimsDateFormControl = new FormControl(new Date().toString());
    this.claimsReceivedDate = this.getParsedDate(this.date.value);

    this.getSalesInvoice(this.route.snapshot.params.invoiceUuid);
  }

  getSalesInvoice(uuid: string) {
    this.salesService.getSalesInvoice(uuid).subscribe({
      next: (success: any) => {
        // this.salesInvoiceDetails = success;
        // this.salesInvoiceDetails.address_display = this.salesInvoiceDetails
        //   .address_display
        //   ? this.salesInvoiceDetails.address_display.replace(/<br>/g, '\n')
        //   : undefined;
        // this.dataSource = success.items;
        let i = 0;
        const itemList = [];
        for (const item of success.items) {
          for (let j = 0; j < item.qty; j++) {
            itemList.push({
              position: i,
              serial: '',
              item: item.item_name,
              company: localStorage.getItem(DEFAULT_COMPANY),
              claimsReceivedDate: this.claimsReceivedDate,
            });
            i++;
          }
        }

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
