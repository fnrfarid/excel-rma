import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
} from '../../constants/storage';
import { StorageService } from '../../api/storage/storage.service';
import {
  API_ITEM_LIST,
  API_ITEM_SET_MIN_PRICE,
  RELAY_GET_STOCK_BALANCE_ENDPOINT,
} from '../../constants/url-strings';
import { ItemListResponse } from '../item-price/item-price.datasource';

@Injectable({
  providedIn: 'root',
})
export class ItemPriceService {
  constructor(
    private readonly storage: StorageService,
    private readonly http: HttpClient,
  ) {}

  findItems(
    filter: string,
    sortOrder: string,
    pageNumber: number,
    pageSize: number,
  ) {
    const url = API_ITEM_LIST;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<ItemListResponse>(url, {
          params,
          headers,
        });
      }),
    );
  }

  getStockBalance(item_code: string, warehouse: string) {
    const url = RELAY_GET_STOCK_BALANCE_ENDPOINT;
    const params = new HttpParams()
      .set('item_code', item_code)
      .set('warehouse', warehouse);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, {
          params,
          headers,
        });
      }),
    );
  }

  setMinPrice(itemUuid: string, minimumPrice: number) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(
          API_ITEM_SET_MIN_PRICE + '/' + itemUuid,
          { minimumPrice },
          {
            headers,
          },
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
}
