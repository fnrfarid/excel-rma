import { Injectable } from '@angular/core';
import {
  SalesInvoice,
  Item,
  APIResponse,
  SerialAssign,
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
  CREATE_SALES_INVOICE_ENDPOINT,
  SUBMIT_SALES_INVOICE_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
  LIST_WAREHOUSE_ENDPOINT,
  LIST_SERIAL_ENDPOINT,
  ASSIGN_SERIAL_ENDPOINT,
  UPDATE_SALES_INVOICE_ENDPOINT,
} from '../../constants/url-strings';
import { switchMap, catchError } from 'rxjs/operators';
import { SalesInvoiceDetails } from '../view-sales-invoice/details/details.component';

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
        item_code: '1',
        item_name: 'TP Link Router',
        qty: 10,
        rate: 2000,
      },
      {
        item_code: '2',
        item_name: 'LG Modem',
        qty: 15,
        rate: 1500,
      },
      {
        item_code: '3',
        item_name: 'Intel NIC',
        qty: 5,
        rate: 4000,
      },
      {
        item_code: '4',
        item_name: 'Network switch',
        qty: 3,
        rate: 10000,
      },
      {
        item_code: '5',
        item_name: 'Line Driver',
        qty: 2,
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

  assignSerials(assignSerial: SerialAssign) {
    const url = ASSIGN_SERIAL_ENDPOINT;

    return this.http.post(url, assignSerial, {
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
    foundItem.item_code = '';
    foundItem.item_name = '';
    foundItem.qty = null;
    foundItem.rate = null;

    this.itemList.forEach(item => {
      if (item.item_code === uuid) foundItem = item;
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

  createSalesInvoice(salesDetails: SalesInvoiceDetails) {
    const url = CREATE_SALES_INVOICE_ENDPOINT;
    return this.http.post(url, salesDetails, {
      headers: this.getAuthorizationHeaders(),
    });
  }

  updateSalesInvoice(salesDetails: SalesInvoiceDetails) {
    const url = UPDATE_SALES_INVOICE_ENDPOINT;
    return this.http.post(url, salesDetails, {
      headers: this.getAuthorizationHeaders(),
    });
  }

  submitSalesInvoice(uuid: string) {
    const url = `${SUBMIT_SALES_INVOICE_ENDPOINT}/${uuid}`;
    return this.http.post(
      url,
      {},
      {
        headers: this.getAuthorizationHeaders(),
      },
    );
  }

  getCustomerList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 10,
  ) {
    const url = LIST_CUSTOMER_ENDPOINT;
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
      );
  }

  getSerialList(filter = '', sortOrder = 'asc', pageNumber = 0, pageSize = 10) {
    const url = LIST_SERIAL_ENDPOINT;
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
      );
  }

  getWarehouseList(value: string) {
    const url = LIST_WAREHOUSE_ENDPOINT;
    const params = new HttpParams({
      fromObject: {
        fields: '["*"]',
        filters: `[["name","like","%${value}%"]]`,
      },
    });
    return this.http
      .get<any>(url, {
        params,
        headers: this.getAuthorizationHeaders(),
      })
      .pipe(
        switchMap(response => {
          return of(response.data);
        }),
      );
  }
}
