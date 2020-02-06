import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../services/sales.service';
import { SalesInvoiceDetails } from '../view-sales-invoice/details/details.component';
import { Item } from '../../common/interfaces/sales.interface';
import { SalesReturn } from '../../common/interfaces/sales-return.interface';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-add-sales-return',
  templateUrl: './add-sales-return.page.html',
  styleUrls: ['./add-sales-return.page.scss'],
})
export class AddSalesReturnPage implements OnInit {
  displayedColumns = ['item', 'quantity', 'rate', 'total'];
  invoiceUuid: string;
  dataSource = [];
  total: number = 0;
  salesInvoiceDetails: SalesInvoiceDetails;
  customerFormControl = new FormControl();
  filteredWarehouseList: Observable<any[]>;
  companyFormControl = new FormControl();
  branchFormControl = new FormControl();
  warehouseFormControl = new FormControl();
  postingDateFormControl = new FormControl();
  dueDateFormControl = new FormControl();
  getOptionText = '';
  constructor(
    private readonly location: Location,
    private readonly route: ActivatedRoute,
    private readonly salesService: SalesService,
  ) {}

  ngOnInit() {
    this.invoiceUuid = this.route.snapshot.params.invoiceUuid;
    this.salesInvoiceDetails = {} as SalesInvoiceDetails;
    this.getSalesInvoice();
    this.filteredWarehouseList = this.warehouseFormControl.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        return this.salesService.getWarehouseList(value);
      }),
    );
  }

  getSalesInvoice() {
    this.salesService.getSalesInvoice(this.invoiceUuid).subscribe({
      next: (res: SalesInvoiceDetails) => {
        this.salesInvoiceDetails = res;
        this.companyFormControl.setValue(res.company);
        this.customerFormControl.setValue(res.customer);
        this.branchFormControl.setValue(res.territory);
        this.warehouseFormControl.setValue(res.delivery_warehouse);
        this.postingDateFormControl.setValue(new Date(res.posting_date));
        this.dueDateFormControl.setValue(new Date(res.due_date));
        this.dataSource = res.delivery_note_items;
        this.calculateTotal(this.dataSource);
      },
    });
  }

  submitSalesReturn() {
    const salesReturn = {} as SalesReturn;
    salesReturn.company = this.salesInvoiceDetails.company;
    salesReturn.contact_email = this.salesInvoiceDetails.contact_email;
    salesReturn.customer = this.salesInvoiceDetails.customer;
    salesReturn.docstatus = 1;
    salesReturn.is_return = true;
    salesReturn.total = 0;
    salesReturn.total_qty = 0;
    salesReturn.items = this.dataSource.filter((item: Item) => {
      item.against_sales_invoice = this.salesInvoiceDetails.name;
      item.qty = 0 - item.qty;
      item.amount = item.rate * item.qty;
      salesReturn.total += item.amount;
      salesReturn.total_qty += item.qty;
      return item;
    });
    salesReturn.posting_date = this.getParsedDate(
      this.postingDateFormControl.value,
    );
    salesReturn.posting_time = this.getFrappeTime();
    salesReturn.set_warehouse = this.warehouseFormControl.value;
    this.salesService.createSalesReturn(salesReturn).subscribe({
      next: success => {
        this.location.back();
      },
    });
  }

  calculateTotal(itemList: Item[]) {
    this.total = 0;
    itemList.forEach(item => {
      this.total += item.qty * item.rate;
    });
  }

  updateQuantity(row: Item, quantity: number) {
    if (quantity == null) {
      return;
    }
    const index = this.dataSource.indexOf(row);
    row.qty = quantity;
    this.dataSource[index].qty = quantity;
    this.calculateTotal(this.dataSource);
  }

  getFrappeTime() {
    const date = new Date();
    return [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
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

  navigateBack() {
    this.location.back();
  }
}
