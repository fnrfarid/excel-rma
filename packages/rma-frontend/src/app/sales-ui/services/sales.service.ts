import { Injectable } from '@angular/core';
import { SalesInvoice } from '../../common/interfaces/sales.interface';
import { of } from 'rxjs';
import { Customer } from '../../common/interfaces/customer.interface';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  salesInvoiceList: Array<SalesInvoice>;

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
}
