import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { StorageService } from '../../../api/storage/storage.service';
import {
  BEARER_TOKEN_PREFIX,
  AUTHORIZATION,
  ACCESS_TOKEN,
} from '../../../constants/storage';
import { map, switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import {
  LIST_DELIVERY_NOTE_ENDPOINT,
  RELAY_GET_DELIVERY_NOTE_ENDPOINT,
} from '../../../constants/url-strings';
@Injectable({
  providedIn: 'root',
})
export class SalesReturnService {
  constructor(private http: HttpClient, private storage: StorageService) {}

  getReturnVoucherList(
    sales_invoice: string,
    filter = '',
    sortOrder = 'asc',
    pageIndex = 0,
    pageSize = 10,
  ) {
    const url = LIST_DELIVERY_NOTE_ENDPOINT;
    const params = new HttpParams()
      .set('sales_invoice', sales_invoice)
      .set('limit', pageSize.toString())
      .set('offset', (pageIndex * pageSize).toString())
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

  getSalesReturnList(pageIndex = 0, pageSize = 10, filters: any[]) {
    const url = RELAY_GET_DELIVERY_NOTE_ENDPOINT;

    const params = new HttpParams({
      fromObject: {
        fields: '["*"]',
        filters: JSON.stringify(filters),
        limit_page_length: pageSize.toString(),
        limit_start: (pageIndex * pageSize).toString(),
      },
    });
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers, params });
      }),
      map(res => res.data),
    );
  }

  getSalesReturn(name: string) {
    const url = `${RELAY_GET_DELIVERY_NOTE_ENDPOINT}/${name}`;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers });
      }),
      map(res => res.data),
    );
  }

  getStore() {
    return this.storage;
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
