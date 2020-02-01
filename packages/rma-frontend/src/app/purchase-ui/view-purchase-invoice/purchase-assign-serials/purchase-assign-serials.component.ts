import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { PurchaseInvoiceDetails } from '../../../common/interfaces/purchase.interface';
import { PurchaseService } from '../../services/purchase.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { startWith, switchMap } from 'rxjs/operators';
import { SalesService } from '../../../sales-ui/services/sales.service';
import { CLOSE } from '../../../constants/app-string';
import { ERROR_FETCHING_PURCHASE_INVOICE } from '../../../constants/messages';

@Component({
  selector: 'purchase-assign-serials',
  templateUrl: './purchase-assign-serials.component.html',
  styleUrls: ['./purchase-assign-serials.component.scss'],
})
export class PurchaseAssignSerialsComponent implements OnInit {
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
  purchaseInvoiceDetails: PurchaseInvoiceDetails;

  constructor(
    private readonly snackbar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly purchaseService: PurchaseService,
    private readonly salesService: SalesService, // private readonly location: Location,
  ) {}

  ngOnInit() {
    this.claimsReceivedDate = this.getParsedDate(this.date.value);
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
              item: item.item_name,
              company: res.company,
              claimsReceivedDate: this.claimsReceivedDate,
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
}
