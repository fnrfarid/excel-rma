import { Injectable } from '@angular/core';
import { switchMap, catchError, map } from 'rxjs/operators';
import {
  LIST_ITEMS_ENDPOINT,
  API_ITEM_GET_BY_CODE,
  RELAY_GET_ITEMPRICE_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
  RELAY_GET_FULL_ADDRESS_ENDPOINT,
  RELAY_GET_ADDRESS_NAME_METHOD_ENDPOINT,
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

@Injectable({
  providedIn: 'root',
})
export class AddServiceInvoiceService {
  itemList: Array<Item>;

  constructor(private http: HttpClient, private storage: StorageService) {}

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

  getAddress(name: string) {
    const getAddressNameURL = RELAY_GET_ADDRESS_NAME_METHOD_ENDPOINT;

    const params = new HttpParams()
      .set('doctype', 'Customer')
      .set('name', name);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http
          .get<any>(getAddressNameURL, { params, headers })
          .pipe(
            map(res => res.message),
            switchMap(address => {
              if (address) {
                const getFullAddressURL =
                  RELAY_GET_FULL_ADDRESS_ENDPOINT + address;
                return this.http
                  .get<any>(getFullAddressURL, { headers })
                  .pipe(map(res => res.data));
              }
              return of({});
            }),
          );
      }),
    );
  }
}
