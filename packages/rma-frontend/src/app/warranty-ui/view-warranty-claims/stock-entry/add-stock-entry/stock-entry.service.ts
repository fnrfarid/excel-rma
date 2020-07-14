import { Injectable } from '@angular/core';
import {
  LIST_ITEMS_ENDPOINT,
  RELAY_GET_ITEMPRICE_ENDPOINT,
  API_ITEM_GET_BY_CODE,
  LIST_TERRITORIES_ENDPOINT,
  GET_SERIAL_ENDPOINT,
  WARRANTY_CLAIM_GET_ONE_ENDPOINT,
} from '../../../../constants/url-strings';
import { HttpParams, HttpClient } from '@angular/common/http';
import { switchMap, catchError, map } from 'rxjs/operators';
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
export class StockEntryService {
  itemList: Array<Item>;
  constructor(
    private readonly storage: StorageService,
    private readonly http: HttpClient,
  ) {}

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
  getSerial(serial_no) {
    const url = `${GET_SERIAL_ENDPOINT}/${serial_no}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers });
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

  getStore() {
    return this.storage;
  }
}
