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
  selectedPostingDate: any;
  displayedColumns = ['item', 'quantity', 'rate', 'total'];
  constructor(
    private readonly route: ActivatedRoute,
    private salesService: SalesService,
    private location: Location,
  ) {
    this.customerList = [
      {
        name: 'Hardik Bhanderi',
        uuid: '2',
        addressLine1: 'C-42 , Sheetal Complex,',
        addressLine2: 'SV Road , Dahisar(E)',
        city: 'Mumbai',
        pinCode: '400068',
        email: 'hardik@castlecraft.in',
      },
      {
        name: 'Prafful Suthar',
        uuid: '1',
        addressLine1: 'C-42 , Sheetal Complex,',
        addressLine2: 'SV Road , Dahisar(E)',
        city: 'Mumbai',
        pinCode: '400068',
        email: 'prafful@castlecraft.in',
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
    salesInvoiceDetails.address_display = `${this.customer.addressLine1} ,${this.customer.addressLine2} , ${this.customer.city} - ${this.customer.pinCode} `;
    salesInvoiceDetails.company = this.salesInvoice.company;
    salesInvoiceDetails.contact_display = this.customer.name;
    salesInvoiceDetails.customer = this.customer.name;
    salesInvoiceDetails.posting_date = this.selectedPostingDate;
    salesInvoiceDetails.due_date = '2019-12-25';
    salesInvoiceDetails.email = this.customer.email;
    salesInvoiceDetails.territory = 'All Territories';
    salesInvoiceDetails.base_net_total = 0;
    salesInvoiceDetails.base_total = 0;
    salesInvoiceDetails.total = 0;
    salesInvoiceDetails.total_qty = 0;
    salesInvoiceDetails.update_stock = 0;
    salesInvoiceDetails.net_total = 0;
    salesInvoiceDetails.pos_total_qty = 0;
    salesInvoiceDetails.set_posting_time = 1;
    salesInvoiceDetails.contact_person = `${salesInvoiceDetails.customer}-${salesInvoiceDetails.contact_display}`;
    salesInvoiceDetails.posting_time = String(new Date().getTime());

    const itemList = this.dataSource.data().filter(item => {
      if (item.item_name !== '') {
        item.amount = item.qty * item.rate;
        salesInvoiceDetails.total_qty += item.qty;
        salesInvoiceDetails.pos_total_qty += item.qty;
        salesInvoiceDetails.base_total += item.amount;
        salesInvoiceDetails.base_net_total += item.amount;
        salesInvoiceDetails.total += item.amount;
        salesInvoiceDetails.net_total += item.amount;
        return item;
      }
    });
    this.salesService
      .createSalesInvoice(salesInvoiceDetails, itemList)
      .subscribe({
        next: success => {
          this.location.back();
        },
      });
  }

  datePicked($event) {
    const date = new Date($event.detail.value);
    this.selectedPostingDate = [
      date.getFullYear(),
      date.getMonth() + 1,
      // +1 as index of months start's from 0
      date.getDate(),
    ].join('-');
  }
}
