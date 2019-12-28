import { Injectable } from '@angular/core';
import { SalesInvoice, Item } from '../../common/interfaces/sales.interface';
import { of } from 'rxjs';
import { Customer } from '../../common/interfaces/customer.interface';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  salesInvoiceList: Array<SalesInvoice>;
  itemList: Array<Item>;

  constructor() {
    this.salesInvoiceList = [
      {
        uuid: '1',
        company: 'Test Company',
        customer: {
          name: 'Hardik Bhanderi',
          uuid: '2',
          addressLine1: 'C-42 , Sheetal Complex,',
          addressLine2: 'SV Road , Dahisar(E)',
          city: 'Mumbai',
          pinCode: '400068',
        },
        series: 'SINV-00001',
        status: 'Draft',
      },
      {
        uuid: '2',
        company: 'CastleCraft',
        customer: {
          name: 'Prafful Suthar',
          uuid: '1',
          addressLine1: 'C-42 , Sheetal Complex,',
          addressLine2: 'SV Road , Dahisar(E)',
          city: 'Mumbai',
          pinCode: '400068',
        },
        series: 'SINV-00002',
        status: 'Paid',
      },
    ];

    this.itemList = [
      {
        itemCode: '1',
        name: 'TP Link Router',
        quantity: 10,
        rate: 2000,
      },
      {
        itemCode: '2',
        name: 'LG Modem',
        quantity: 15,
        rate: 1500,
      },
      {
        itemCode: '3',
        name: 'Intel NIC',
        quantity: 5,
        rate: 4000,
      },
      {
        itemCode: '4',
        name: 'Network switch',
        quantity: 3,
        rate: 10000,
      },
      {
        itemCode: '5',
        name: 'Line Driver',
        quantity: 2,
        rate: 17000,
      },
    ];
  }

  getSalesInvoiceList() {
    return of(this.salesInvoiceList);
  }

  getSalesInvoice(series: string) {
    let foundInvoice = {} as SalesInvoice;
    foundInvoice.company = '';
    foundInvoice.customer = {} as Customer;
    foundInvoice.series = '';
    foundInvoice.status = '';

    this.salesInvoiceList.forEach(invoice => {
      if (invoice.series === series) foundInvoice = invoice;
    });

    return of(foundInvoice);
  }

  getItemList() {
    return of(this.itemList);
  }

  getItem(uuid: string) {
    let foundItem = {} as Item;
    foundItem.itemCode = '';
    foundItem.name = '';
    foundItem.quantity = null;
    foundItem.rate = null;

    this.itemList.forEach(item => {
      if (item.itemCode === uuid) foundItem = item;
    });

    return of(foundItem);
  }
}
