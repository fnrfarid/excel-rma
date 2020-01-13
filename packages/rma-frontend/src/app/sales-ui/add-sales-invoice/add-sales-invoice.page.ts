import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesInvoice, Item } from '../../common/interfaces/sales.interface';
import { Customer } from '../../common/interfaces/customer.interface';
import { ItemsDataSource } from './items-datasource';
import { SalesService } from '../services/sales.service';
import { Location } from '@angular/common';
import { SalesInvoiceDetails } from '../view-sales-invoice/details/details.component';

@Component({
  selector: 'app-add-sales-invoice',
  templateUrl: './add-sales-invoice.page.html',
  styleUrls: ['./add-sales-invoice.page.scss'],
})
export class AddSalesInvoicePage implements OnInit {
  salesInvoice: SalesInvoice;
  calledFrom: string;
  customerList: Array<Customer>;
  dataSource: ItemsDataSource;
  customer: Customer;
  series: string;
  selectedPostingDate: string;
  selectedDueDate: string;
  displayedColumns = ['item', 'quantity', 'rate', 'total'];
  constructor(
    private readonly route: ActivatedRoute,
    private salesService: SalesService,
    private location: Location,
  ) {
    this.customerList = [
      {
        name: 'Prafful suthar',
        uuid: '2',
        addressLine1: 'C-42 , Sheetal Complex,',
        addressLine2: 'SV Road , Dahisar(E)',
        city: 'Mumbai',
        pinCode: '400068',
        email: 'prafful@castlecraft.in',
      },
      {
        name: 'prafful 2',
        uuid: '1',
        addressLine1: 'C-42 , Sheetal Complex,',
        addressLine2: 'SV Road , Dahisar(E)',
        city: 'Mumbai',
        pinCode: '400068',
        email: 'prafful@mntechnique.com',
      },
    ];
  }

  ngOnInit() {
    this.calledFrom = this.route.snapshot.params.calledFrom;
    this.salesInvoice = {} as SalesInvoice;

    this.salesInvoice.company = '';

    this.customer = {} as Customer;
    this.customer.addressLine1 = '';
    this.customer.addressLine2 = '';
    this.customer.city = '';
    this.customer.name = '';
    this.customer.pinCode = '';
    this.customer.uuid = '';
    this.series = '';
    this.dataSource = new ItemsDataSource();
    this.dataSource.loadItems();
  }

  addItem() {
    const data = this.dataSource.data();
    const item = {} as Item;
    item.item_name = '';
    item.qty = 0;
    item.rate = 0;
    item.item_code = '';
    data.push(item);
    this.dataSource.update(data);
  }

  updateItem(row: Item, item: Item) {
    if (item == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    row.item_code = item.item_code;
    row.item_name = item.item_name;
    row.name = item.name;
    row.owner = item.owner;
    row.qty = 1;
    row.rate = 0;
    this.dataSource.update(copy);
  }

  updateQuantity(row: Item, quantity: number) {
    if (quantity == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    row.qty = quantity;
    this.dataSource.update(copy);
  }

  updateRate(row: Item, rate: number) {
    if (rate == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    row.rate = rate;
    this.dataSource.update(copy);
  }

  navigateBack() {
    this.location.back();
  }

  submitDraft() {
    const salesInvoiceDetails = {} as SalesInvoiceDetails;
    salesInvoiceDetails.customer = this.customer.name;
    salesInvoiceDetails.company = this.salesInvoice.company;
    salesInvoiceDetails.posting_date = this.selectedPostingDate;
    salesInvoiceDetails.posting_time = this.getFrappeTime();
    salesInvoiceDetails.set_posting_time = 1;
    salesInvoiceDetails.due_date = this.selectedDueDate;
    salesInvoiceDetails.territory = 'All Territories';
    salesInvoiceDetails.update_stock = 0;
    salesInvoiceDetails.total_qty = 0;
    salesInvoiceDetails.total = 0;
    salesInvoiceDetails.contact_email = this.customer.email;
    const itemList = this.dataSource.data().filter(item => {
      if (item.item_name !== '') {
        item.amount = item.qty * item.rate;
        salesInvoiceDetails.total_qty += item.qty;
        salesInvoiceDetails.total += item.amount;
        // salesInvoiceDetails.pos_total_qty += item.qty;
        // salesInvoiceDetails.base_total += item.amount;
        // salesInvoiceDetails.base_net_total += item.amount;
        // salesInvoiceDetails.net_total += item.amount;
        return item;
      }
    });
    salesInvoiceDetails.items = itemList;
    // optional fields
    // salesInvoiceDetails.address_display =
    // `${this.customer.addressLine1} ,${this.customer.addressLine2} , ${this.customer.city} - ${this.customer.pinCode} `;
    // salesInvoiceDetails.contact_display = this.customer.name;
    // salesInvoiceDetails.email = this.customer.email;
    // salesInvoiceDetails.contact_person = `${salesInvoiceDetails.customer}-${salesInvoiceDetails.contact_display}`;

    this.salesService.createSalesInvoice(salesInvoiceDetails).subscribe({
      next: success => {
        this.location.back();
      },
      error: err => {},
    });
  }

  postingDate($event) {
    this.selectedPostingDate = this.getParsedDate($event.detail.value);
  }

  dueDate($event) {
    this.selectedDueDate = this.getParsedDate($event.detail.value);
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
}
