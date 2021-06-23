import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  AUTH_SERVER_URL,
  BEARER_TOKEN_PREFIX,
} from '../../constants/storage';
import { from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { StorageService } from '../../api/storage/storage.service';
import {
  PRINT_WARRANTY_INVOICE_ENDPOINT,
  LIST_WARRANTY_INVOICE_ENDPOINT,
  WARRANTY_CLAIM_GET_ONE_ENDPOINT,
  RESET_WARRANTY_CLAIM_ENDPOINT,
  REMOVE_WARRANTY_CLAIM_ENDPOINT,
  LIST_CUSTOMER_ENDPOINT,
  LIST_ITEMS_ENDPOINT,
  RELAY_LIST_PRINT_FORMAT_ENDPOINT,
  PRINT_SALES_INVOICE_PDF_METHOD,
} from '../../constants/url-strings';
import { APIResponse, Item } from '../../common/interfaces/sales.interface';
import { of } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  itemList: Array<Item>;

  constructor(
    private http: HttpClient,
    private readonly storage: StorageService,
  ) {
    this.itemList = [];
  }

  findModels(
    model: string,
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 30,
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
    pageSize = 30,
    query,
    territory?,
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

  getCustomerList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 30,
  ) {
    const url = LIST_CUSTOMER_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('search', encodeURIComponent(filter))
      .set('sort', sortOrder);

    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<APIResponse>(url, {
          params,
          headers,
        });
      }),
      map(res => res.docs),
    );
  }

  getItemList(
    filter: any = {},
    sortOrder: any = { item_name: 'asc' },
    pageIndex = 0,
    pageSize = 30,
    query?: { [key: string]: any },
  ) {
    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch {
      sortOrder = JSON.stringify({ item_name: 'asc' });
    }
    const url = LIST_ITEMS_ENDPOINT;
    query = query ? query : {};
    query.item_name = filter?.item_name ? filter.item_name : filter;
    query.disabled = 0;

    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageIndex * pageSize).toString())
      .set('search', encodeURIComponent(JSON.stringify(query)))
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

  getPrintFormats(name: string = '') {
    return switchMap(value => {
      if (!value) value = '';
      const url = RELAY_LIST_PRINT_FORMAT_ENDPOINT;
      const params = new HttpParams({
        fromObject: {
          fields: `["name"]`,
          filters: value
            ? `[["doc_type", "=", "Warranty Print"],["name","like","%${value}%"]]`
            : `[["doc_type", "=", "Warranty Print"],["name","like","%''%"]]`,
        },
      });
      return this.getHeaders().pipe(
        switchMap(headers => {
          return this.http
            .get<{ data: unknown[] }>(url, {
              headers,
              params,
            })
            .pipe(map(res => res.data));
        }),
      );
    });
  }

  getStorage() {
    return this.storage;
  }

  printDocument(doc) {
    const blob = new Blob([JSON.stringify(doc)], {
      type: 'application/json',
    });
    const uploadData = new FormData();
    uploadData.append('file', blob, 'purchase_receipts');
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(PRINT_WARRANTY_INVOICE_ENDPOINT, uploadData, {
          headers,
          responseType: 'arraybuffer',
        });
      }),
    );
  }

  resetClaim(uuid: string, serial_no?: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<any>(
          `${RESET_WARRANTY_CLAIM_ENDPOINT}`,
          { uuid, serial_no },
          { headers },
        );
      }),
    );
  }

  removeClaim(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post<any>(
          `${REMOVE_WARRANTY_CLAIM_ENDPOINT}${uuid}`,
          {},
          { headers },
        );
      }),
    );
  }

  openPdf(format, uuid) {
    this.getStorage()
      .getItem(AUTH_SERVER_URL)
      .then(auth_url => {
        window.open(
          `${auth_url}${PRINT_SALES_INVOICE_PDF_METHOD}?doctype=Excel%20Warranty%20Print&name=` +
            `${uuid}` +
            `&format=${format.name}` +
            `&no_letterhead=0` +
            `&_lang=en`,
          '_blank',
        );
      });
  }
}
