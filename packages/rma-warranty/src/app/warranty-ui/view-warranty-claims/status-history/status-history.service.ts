import { Injectable } from '@angular/core';
import {
  LIST_TERRITORIES_ENDPOINT,
  ADD_STATUS_HISTORY_ENDPOINT,
  WARRANTY_CLAIM_GET_ONE_ENDPOINT,
  REMOVE_STATUS_HISTORY_ENDPOINT,
  GET_WARRANTY_STOCK_ENTRY,
} from '../../../constants/url-strings';
import { switchMap, map } from 'rxjs/operators';
import { APIResponse } from '../../../common/interfaces/sales.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from } from 'rxjs';
import {
  ACCESS_TOKEN,
  BEARER_TOKEN_PREFIX,
  AUTHORIZATION,
} from '../../../constants/storage';
import { StorageService } from '../../../api/storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class StatusHistoryService {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {}

  getTerritoryList(
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

  getHeaders() {
    return from(this.storage.getItem(ACCESS_TOKEN)).pipe(
      map(token => {
        return {
          [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
        };
      }),
    );
  }

  addStatusHistory(payload) {
    const url = ADD_STATUS_HISTORY_ENDPOINT;

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, payload, { headers });
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

  removeStatusHistory(uuid: string) {
    const URL = REMOVE_STATUS_HISTORY_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(URL, uuid, { headers });
      }),
    );
  }

  getStockEntry(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(`${GET_WARRANTY_STOCK_ENTRY}/${uuid}`, {
          headers,
        });
      }),
    );
  }

  getStorage() {
    return this.storage;
  }
}
