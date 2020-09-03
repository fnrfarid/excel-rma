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
import {
  LIST_WARRANTY_INVOICE_ENDPOINT,
  WARRANTY_CLAIM_GET_ONE_ENDPOINT,
  CUSTOMER_ENDPOINT,
} from '../../constants/url-strings';
import { APIResponse } from '../../common/interfaces/sales.interface';
@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  constructor(
    private http: HttpClient,
    private readonly storage: StorageService,
  ) {}

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
  getWarrantyClaimsList(
    sortOrder,
    pageNumber = 0,
    pageSize = 10,
    query,
    territory,
  ) {
    if (!sortOrder) sortOrder = { createdOn: 'desc' };
    if (!query) query = {};
    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch (error) {
      sortOrder = JSON.stringify({ createdOn: 'desc' });
    }
    const url = LIST_WARRANTY_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('sort', sortOrder)
      .set('filter_query', JSON.stringify(query))
      .set('territories', JSON.stringify(territory));

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
    );
  }

  getWarrantyClaim(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(`${WARRANTY_CLAIM_GET_ONE_ENDPOINT}${uuid}`, {
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

  getAddressList() {
    const url = CUSTOMER_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { headers });
      }),
      map(res => res.data),
    );
  }

  getStorage() {
    return this.storage;
  }
}