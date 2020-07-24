import { Injectable } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { switchMap, map } from 'rxjs/operators';
import {
  RELAY_GET_FULL_ADDRESS_ENDPOINT,
  RELAY_GET_ADDRESS_NAME_METHOD_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
  GET_DIRECT_SERIAL_ENDPOINT,
  LIST_ITEMS_ENDPOINT,
  LIST_TERRITORIES_ENDPOINT,
  CREATE_WARRANTY_CLAIM_ENDPOINT,
  GET_ITEM_BY_ITEM_CODE_ENDPOINT,
  RELAY_GET_FULL_ITEM_ENDPOINT,
} from '../../constants/url-strings';
import { of, from } from 'rxjs';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
} from '../../constants/storage';
import { StorageService } from '../../api/storage/storage.service';
import { APIResponse } from '../../common/interfaces/sales.interface';
import { WarrantyClaimsDetails } from '../../common/interfaces/warranty.interface';

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

  getSerial(name: string) {
    const URL = `${GET_DIRECT_SERIAL_ENDPOINT}/${name}`;
    const params = new HttpParams().set('serial_no', name);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(URL, {
          params,
          headers,
        });
      }),
    );
  }

  getItemList(filter = '', sortOrder = 'asc', pageNumber = 0, pageSize = 10) {
    const url = LIST_ITEMS_ENDPOINT;
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

  getItemBrandFromERP(item_code: string) {
    const url = `${RELAY_GET_FULL_ITEM_ENDPOINT}${item_code}`;
    const params = new HttpParams();

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(url, { params, headers });
      }),
      map(res => res.data),
      switchMap(res => {
        return of(res);
      }),
    );
  }

  getItem(item_code: string) {
    const URL = `${GET_ITEM_BY_ITEM_CODE_ENDPOINT}/${item_code}`;
    const params = new HttpParams().set('item_code', item_code);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(URL, {
          params,
          headers,
        });
      }),
    );
  }

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

  createWarrantyClaim(warrantyClaimDetails: WarrantyClaimsDetails) {
    const url = CREATE_WARRANTY_CLAIM_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<WarrantyClaimsDetails>(
          url,
          warrantyClaimDetails,
          {
            headers,
          },
        );
      }),
    );
  }
  getStorage() {
    return this.storage;
  }
}
