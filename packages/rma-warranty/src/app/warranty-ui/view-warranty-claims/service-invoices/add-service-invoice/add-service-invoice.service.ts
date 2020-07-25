import { Injectable } from '@angular/core';
import { switchMap, catchError, map } from 'rxjs/operators';
import {
  LIST_ITEMS_ENDPOINT,
  API_ITEM_GET_BY_CODE,
  RELAY_GET_ITEMPRICE_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
  LIST_TERRITORIES_ENDPOINT,
  WARRANTY_CLAIM_GET_ONE_ENDPOINT,
  CREATE_SERVICE_INVOICE_ENDPOINT,
  GET_DIRECT_SERIAL_ENDPOINT,
  CREATE_WARRANTY_STOCK_ENTRY,
  LIST_SERVICE_INVOICE_ENDPOINT,
} from '../../../../constants/url-strings';
import { HttpParams, HttpClient } from '@angular/common/http';
import {
  APIResponse,
  Item,
} from '../../../../common/interfaces/sales.interface';
import { of, from } from 'rxjs';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
  DEFAULT_SELLING_PRICE_LIST,
} from '../../../../constants/storage';
import { StorageService } from '../../../../api/storage/storage.service';
import { ServiceInvoiceDetails } from './service-invoice-interface';
import { StockEntryDetails } from '../../../../common/interfaces/warranty.interface';

@Injectable({
  providedIn: 'root',
})
export class AddServiceInvoiceService {
  itemList: Array<Item>;

  constructor(private http: HttpClient, private storage: StorageService) {}

  getWarehouseList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 10,
  ) {
    const url = LIST_TERRITORIES_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
    );
  }

  getItemList(
    filter = {},
    sortOrder: any = { item_name: 'asc' },
    pageIndex = 0,
    pageSize = 10,
  ) {
    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch {
      sortOrder = JSON.stringify({ item_name: 'asc' });
    }
    const url = LIST_ITEMS_ENDPOINT;
    const query: any = {};
    query.item_name = filter;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageIndex * pageSize).toString())
      .set('search', JSON.stringify(query))
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
  getHeaders() {
    return from(this.storage.getItem(ACCESS_TOKEN)).pipe(
      map(token => {
        return {
          [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
        };
      }),
    );
  }

  getItemPrice(item_code: string) {
    const url = RELAY_GET_ITEMPRICE_ENDPOINT;
    return from(this.storage.getItem(DEFAULT_SELLING_PRICE_LIST)).pipe(
      switchMap(priceList => {
        const params = new HttpParams({
          fromObject: {
            fields: '["price_list_rate"]',
            filters: `[["item_code","=","${item_code}"],["price_list","=","${priceList}"]]`,
          },
        });

        return this.getHeaders().pipe(
          switchMap(headers => {
            return this.http
              .get<{ data: { price_list_rate: number }[] }>(url, {
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
      }),
    );
  }

  getItemFromRMAServer(code: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<Item>(API_ITEM_GET_BY_CODE + '/' + code, {
          headers,
        });
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
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
    );
  }

  getWarrantyDetail(uuid: string) {
    const getWarrantyURL = `${WARRANTY_CLAIM_GET_ONE_ENDPOINT}${uuid}`;
    const params = new HttpParams();

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(getWarrantyURL, {
          params,
          headers,
        });
      }),
    );
  }

  validateItemList(itemCodeList: string[]) {
    const filteredList = [...new Set(itemCodeList)];
    if (filteredList.length === itemCodeList.length) return true;
    return false;
  }

  createServiceInvoice(serviceInvoiceDetails: ServiceInvoiceDetails) {
    const url = CREATE_SERVICE_INVOICE_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<ServiceInvoiceDetails>(
          url,
          serviceInvoiceDetails,
          {
            headers,
          },
        );
      }),
    );
  }

  getSerial(serial_no) {
    const url = `${GET_DIRECT_SERIAL_ENDPOINT}/${serial_no}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers });
      }),
    );
  }

  createStockEntry(warrantyStockPayload) {
    const url = CREATE_WARRANTY_STOCK_ENTRY;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<StockEntryDetails>(url, warrantyStockPayload, {
          headers,
        });
      }),
    );
  }

  getStore() {
    return this.storage;
  }

  getServiceInvoiceList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 10,
  ) {
    const url = LIST_SERVICE_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
      map(res => res.docs),
      switchMap(res => {
        return of(res);
      }),
    );
  }
}
