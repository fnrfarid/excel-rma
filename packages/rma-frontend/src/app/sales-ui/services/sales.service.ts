import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, from } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import {
  SalesInvoice,
  Item,
  APIResponse,
  SerialAssign,
} from '../../common/interfaces/sales.interface';
// import { Customer } from '../../common/interfaces/customer.interface';
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
  RELAY_GET_ITEMPRICE_ENDPOINT,
  GET_SERIAL_ENDPOINT,
} from '../../constants/url-strings';
import { SalesInvoiceDetails } from '../view-sales-invoice/details/details.component';
import { StorageService } from '../../api/storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  salesInvoiceList: Array<SalesInvoice>;
  itemList: Array<Item>;

  constructor(private http: HttpClient, private storage: StorageService) {
    this.salesInvoiceList = [];

    this.itemList = [];
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
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(url, {
          params,
          headers,
        });
      }),
    );
  }

  getSalesInvoice(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(`${SALES_INVOICE_GET_ONE_ENDPOINT}${uuid}`, {
          headers,
        });
      }),
    );
  }

  assignSerials(assignSerial: SerialAssign) {
    const url = ASSIGN_SERIAL_ENDPOINT;

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, assignSerial, {
          headers,
        });
      }),
    );
  }

  getItemList(filter = '', sortOrder = 'asc', pageNumber = 0, pageSize = 10) {
    const url = LIST_ITEMS_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<APIResponse>(url, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.docs);
            }),
            catchError(err => {
              return of(this.itemList);
            }),
          );
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

  getDeliveryNoteList(pageNumber?, pageSize?) {
    const url = LIST_SALES_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString());
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(url, {
          params,
          headers,
        });
      }),
    );
  }

  createSalesInvoice(salesDetails: SalesInvoiceDetails) {
    const url = CREATE_SALES_INVOICE_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, salesDetails, {
          headers,
        });
      }),
    );
  }

  updateSalesInvoice(salesDetails: SalesInvoiceDetails) {
    const url = UPDATE_SALES_INVOICE_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, salesDetails, {
          headers,
        });
      }),
    );
  }

  submitSalesInvoice(uuid: string) {
    const url = `${SUBMIT_SALES_INVOICE_ENDPOINT}/${uuid}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, {}, { headers });
      }),
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

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<APIResponse>(url, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.docs);
            }),
          );
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

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<APIResponse>(url, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.docs);
            }),
          );
      }),
    );
  }

  getSerial(serial_no) {
    const url = `${GET_SERIAL_ENDPOINT}/${serial_no}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any[]>(url, { headers });
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

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<any>(url, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.data);
            }),
          );
      }),
    );
  }

  getItemPrice(item_code: string) {
    const url = RELAY_GET_ITEMPRICE_ENDPOINT;
    const params = new HttpParams({
      fromObject: {
        fields: '["price_list_rate"]',
        filters: `[["item_code","=","${item_code}"],["price_list","=","Standard Selling"]]`,
      },
    });

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<any>(url, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.data);
            }),
          );
      }),
    );
  }

  getHeaders() {
    return from(this.storage.getItem(ACCESS_TOKEN)).pipe(
      map(token => {
        return {
          [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
        };
      }),
    );
  }

  validateItemList(itemCodeList: string[]) {
    const filteredList = [...new Set(itemCodeList)];
    if (filteredList.length === itemCodeList.length) return true;
    return false;
  }

  getStore() {
    return this.storage;
  }
}
