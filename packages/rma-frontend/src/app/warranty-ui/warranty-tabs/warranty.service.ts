import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
} from '../../constants/storage';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StorageService } from '../../api/storage/storage.service';
import { WarrantyClaims } from '../../common/interfaces/warranty.interface';
import { Item } from '../../common/interfaces/warranty.interface';
import { LIST_WARRANTY_INVOICE_ENDPOINT } from '../../constants/url-strings';
import { APIResponse } from '../../common/interfaces/sales.interface';
@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  warrantyInvoiceList: Array<WarrantyClaims>;
  warrantyList: Array<Item>;
  constructor(
    private http: HttpClient,
    private readonly storage: StorageService,
  ) {
    this.warrantyInvoiceList = [];
    this.warrantyList = [];
  }

  findModels(
    model: string,
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 10,
  ) {
    const url = `api/${model}/v1/list`;
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
  getWarrantyClaimsList(sortOrder, pageNumber = 0, pageSize = 10, query) {
    if (!sortOrder) sortOrder = { posting_date: 'desc' };
    if (!query) query = {};

    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch (error) {
      sortOrder = JSON.stringify({ posting_date: 'desc' });
    }
    const url = LIST_WARRANTY_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('sort', sortOrder)
      .set('filter_query', JSON.stringify(query));

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
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
