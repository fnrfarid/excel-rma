import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { switchMap, map } from 'rxjs/operators';
import { from } from 'rxjs';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
} from '../../constants/storage';
import { SerialSearchFields } from './search-fields.interface';
import {
  SERIAL_LIST_API,
  RELAY_DOCTYPE_ENDPOINT_PREFIX,
  GET_DIRECT_SERIAL_ENDPOINT,
  API_INFO_ENDPOINT,
} from '../../constants/url-strings';
import { StorageService } from '../../api/storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SerialSearchService {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {}

  getSerialsList(
    sortOrder: SerialSearchFields | string,
    pageNumber: number,
    pageSize: number,
    query: SerialSearchFields,
  ) {
    if (!sortOrder) sortOrder = { serial_no: 'asc' };
    if (!query) query = {};
    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch (error) {
      sortOrder = JSON.stringify({ createdOn: 'desc' });
    }
    const url = SERIAL_LIST_API;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('sort', sortOrder)
      .set('query', JSON.stringify(query));

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<{
          docs: any[];
          length: number;
          offset: number;
        }>(url, {
          params,
          headers,
        });
      }),
    );
  }

  relayDocTypeOperation(docType: string) {
    return switchMap(value => {
      if (!value) value = '';
      const params = new HttpParams({
        fromObject: {
          fields: '["*"]',
          filters: `[["name","like","%${value}%"]]`,
        },
      });
      return this.getHeaders().pipe(
        switchMap(headers => {
          return this.http
            .get<{ data: unknown[] }>(RELAY_DOCTYPE_ENDPOINT_PREFIX + docType, {
              headers,
              params,
            })
            .pipe(map(res => res.data));
        }),
      );
    });
  }

  getSerialData(serialNo: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<SerialSearchFields>(
          `${GET_DIRECT_SERIAL_ENDPOINT}/${serialNo}`,
          { headers },
        );
      }),
    );
  }

  getApiInfo() {
    return this.http.get<any>(API_INFO_ENDPOINT);
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

  getStore() {
    return this.storage;
  }
}
