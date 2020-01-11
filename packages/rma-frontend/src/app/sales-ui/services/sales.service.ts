import { Injectable } from '@angular/core';
import {
  SalesInvoice,
  Item,
  APIResponse,
} from '../../common/interfaces/sales.interface';
import { of } from 'rxjs';
// import { Customer } from '../../common/interfaces/customer.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
} from '../../constants/storage';
import {
  LIST_SALES_INVOICE_ENDPOINT,
  SALES_INVOICE_GET_ONE_ENDPOINT,
  LIST_ITEMS_ENDPOINT,
} from '../../constants/url-strings';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  salesInvoiceList: Array<SalesInvoice>;
  itemList: Array<Item>;

  constructor(private http: HttpClient) {
    this.salesInvoiceList = [];

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

  getSalesInvoiceList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 10,
  ) {
    const url = LIST_SALES_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);
    return this.http.get(url, {
      params,
      headers: this.getAuthorizationHeaders(),
    });
  }

  getSalesInvoice(uuid: string) {
    return this.http.get(`${SALES_INVOICE_GET_ONE_ENDPOINT}${uuid}`, {
      headers: this.getAuthorizationHeaders(),
    });
  }

  getItemList(filter = '', sortOrder = 'asc', pageNumber = 0, pageSize = 10) {
    const url = LIST_ITEMS_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);

    return this.http
      .get<APIResponse>(url, {
        params,
        headers: this.getAuthorizationHeaders(),
      })
      .pipe(
        switchMap(response => {
          return of(response.docs);
        }),
        catchError(err => {
          return of(this.itemList);
        }),
      );
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

  getAuthorizationHeaders() {
    const headers = {};
    headers[AUTHORIZATION] = `${BEARER_TOKEN_PREFIX}${localStorage.getItem(
      ACCESS_TOKEN,
    )}`;
    return headers;
  }

  getDeliveryNoteList(pageNumber?, pageSize?) {
    const url = LIST_SALES_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString());
    return this.http.get(url, {
      params,
      headers: this.getAuthorizationHeaders(),
    });
  }
}
