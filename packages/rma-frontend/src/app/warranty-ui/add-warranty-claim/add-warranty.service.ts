import { Injectable } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { switchMap, map } from 'rxjs/operators';
import {
  RELAY_GET_FULL_ADDRESS_ENDPOINT,
  RELAY_GET_ADDRESS_NAME_METHOD_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
} from '../../constants/url-strings';
import { of, from } from 'rxjs';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
} from '../../constants/storage';
import { StorageService } from '../../api/storage/storage.service';
import { APIResponse } from '../../common/interfaces/sales.interface';

@Injectable({
  providedIn: 'root',
})
export class AddWarrantyService {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {}

  getAddress(name: string) {
    const getAddressNameURL = RELAY_GET_ADDRESS_NAME_METHOD_ENDPOINT;

    const params = new HttpParams()
      .set('doctype', 'Customer')
      .set('name', name);

    const state: any = {};

    return this.getHeaders().pipe(
      switchMap(headers => {
        state.headers = headers;
        return this.http.get<any>(getAddressNameURL, { params, headers });
      }),
      map(res => res.message),
      switchMap(address => {
        if (address) {
          const getFullAddressURL = RELAY_GET_FULL_ADDRESS_ENDPOINT + address;
          return this.http
            .get<any>(getFullAddressURL, { headers: state.headers })
            .pipe(map(res => res.data));
        }
        return of({});
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

  getSerial(name: string) {}
}
