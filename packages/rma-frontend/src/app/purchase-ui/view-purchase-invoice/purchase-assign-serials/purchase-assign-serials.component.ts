import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { PurchaseInvoiceDetails } from '../../../common/interfaces/purchase.interface';
import { PurchaseService } from '../../services/purchase.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { startWith, switchMap } from 'rxjs/operators';
import { SalesService } from '../../../sales-ui/services/sales.service';
import { CLOSE } from '../../../constants/app-string';
import { ERROR_FETCHING_PURCHASE_INVOICE } from '../../../constants/messages';
import {
  PurchaseReceipt,
  PurchaseReceiptItem,
} from '../../../common/interfaces/purchase-receipt.interface';
import { Location } from '@angular/common';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'purchase-assign-serials',
  templateUrl: './purchase-assign-serials.component.html',
  styleUrls: ['./purchase-assign-serials.component.scss'],
})
export class PurchaseAssignSerialsComponent implements OnInit {
  warehouseFormControl = new FormControl('', [Validators.required]);
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
  purchaseReceiptDate: string;

  filteredWarehouseList: Observable<any[]>;
  purchaseInvoiceDetails: PurchaseInvoiceDetails;

  constructor(
    private readonly snackbar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly purchaseService: PurchaseService,
    private readonly location: Location,
    private readonly salesService: SalesService,
    private loadingController: LoadingController,
  ) {}

  ngOnInit() {
    this.purchaseReceiptDate = this.getParsedDate(this.date.value);
    this.getPuchaseInvoice(this.route.snapshot.params.invoiceUuid);
    this.purchaseInvoiceDetails = {} as PurchaseInvoiceDetails;
    this.filteredWarehouseList = this.warehouseFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getWarehouseList(value);
      }),
    );
  }

  getPuchaseInvoice(uuid: string) {
    this.purchaseService.getPurchaseInvoice(uuid).subscribe({
      next: (res: PurchaseInvoiceDetails) => {
        this.purchaseInvoiceDetails = res;
        const itemList = [];
        res.items.forEach(item => {
          for (let j = 0; j < item.qty; j++) {
            itemList.push({
              position: j + 1,
              serial_no: '',
              item_name: item.item_name,
              company: res.company,
              claimsReceivedDate: this.purchaseReceiptDate,
              rate: item.rate,
              qty: 1,
              amount: item.rate,
              item_code: item.item_code,
              supplier: res.supplier,
            });
          }
          this.dataSource = itemList;
        });
      },
      error: err => {
        this.snackbar.open(
          err.error.message
            ? err.error.message
            : `${ERROR_FETCHING_PURCHASE_INVOICE}${err.error.error}`,
          CLOSE,
          { duration: 2500 },
        );
      },
    });
  }

  async submitDeliveryNote() {
    const loading = await this.loadingController.create({
      message: 'Creating Serials',
      spinner: 'bubbles',
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
      ...new Set(this.dataSource.map(item => item.item_code)),
    ];
    filteredItemCodeList.forEach(item_code => {
      const purchaseReceiptItem = {} as PurchaseReceiptItem;
      purchaseReceiptItem.warehouse = this.warehouseFormControl.value;
      purchaseReceiptItem.serial_no = [];
      purchaseReceiptItem.qty = 0;
      purchaseReceiptItem.amount = 0;
      purchaseReceiptItem.rate = 0;
      purchaseReceiptItem.item_code = item_code;
      this.dataSource.forEach(item => {
        if (item_code === item.item_code && item.serial_no !== '') {
          purchaseReceiptItem.qty += 1;
          purchaseReceiptItem.amount += item.rate;
          purchaseReceiptItem.serial_no.push(item.serial_no);
          purchaseReceiptItem.rate = item.rate;
          purchaseReceiptItem.item_name = item.item_name;
        }
      });
      purchaseReceipt.total += purchaseReceiptItem.amount;
      purchaseReceipt.total_qty += purchaseReceiptItem.qty;
      purchaseReceipt.items.push(purchaseReceiptItem);
    });

    this.purchaseService.createPurchaseReceipt(purchaseReceipt).subscribe({
      next: success => {
        loading.dismiss();
        this.snackbar.open('Purchase Receipt created', CLOSE, {
          duration: 2500,
        });
        this.location.back();
      },
      error: err => {
        loading.dismiss();
        this.snackbar.open('Something went wrong ', CLOSE, {
          duration: 2500,
        });
      },
    });
  }

  updateSerial(element, serial_no) {
    if (serial_no) {
      const index = this.dataSource.indexOf(element);
      this.dataSource[index].serial_no = serial_no;
      this.salesService.getSerial(serial_no).subscribe({
        next: res => {
          this.dataSource[index].serial_no = '';
          this.snackbar.open('Serial No already in use.', CLOSE, {
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
}
