import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesInvoice, Item } from '../../common/interfaces/sales.interface';
import { Customer } from '../../common/interfaces/customer.interface';
import { ItemsDataSource } from './items-datasource';
// import { SalesService } from '../services/sales.service';
import { Location } from '@angular/common';

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
  displayedColumns = ['item', 'quantity', 'rate', 'total'];
  constructor(
    private readonly route: ActivatedRoute,
    // private salesService: SalesService,
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
      },
      {
        name: 'Prafful Suthar',
        uuid: '1',
        addressLine1: 'C-42 , Sheetal Complex,',
        addressLine2: 'SV Road , Dahisar(E)',
        city: 'Mumbai',
        pinCode: '400068',
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
    item.name = '';
    item.quantity = 0;
    item.rate = 0;
    item.itemCode = '';
    data.push(item);
    this.dataSource.update(data);
  }

  updateItem(row: Item, item: Item) {
    if (item == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    row.name = item.name;
    row.quantity = 1;
    row.rate = 0;
    this.dataSource.update(copy);
  }

  updateQuantity(row: Item, quantity: number) {
    if (quantity == null) {
      return;
    }
    const copy = this.dataSource.data().slice();
    row.quantity = quantity;
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
}
