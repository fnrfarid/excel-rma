import { Injectable } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import {
  BEARER_TOKEN_PREFIX,
  AUTHORIZATION,
  ACCESS_TOKEN,
} from '../../constants/storage';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  LIST_PURCHASE_INVOICE_ENDPOINT,
  PURCHASE_INVOICE_GET_ONE_ENDPOINT,
  API_INFO_ENDPOINT,
  CREATE_PURCHASE_RECEIPT_ENDPOINT,
} from '../../constants/url-strings';
import { StorageService } from '../../api/storage/storage.service';
import { PurchaseReceipt } from '../../common/interfaces/purchase-receipt.interface';
@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  constructor(private http: HttpClient, private storage: StorageService) {}

  getPurchaseInvoiceList(
    filter = '',
    sortOrder = 'asc',
    pageNumber = 0,
    pageSize = 10,
  ) {
    const url = LIST_PURCHASE_INVOICE_ENDPOINT;
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

  getPurchaseInvoice(uuid: string) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(`${PURCHASE_INVOICE_GET_ONE_ENDPOINT}${uuid}`, {
          headers,
        });
      }),
    );
  }

  createPurchaseReceipt(purchaseReceipt: PurchaseReceipt) {
    const url = CREATE_PURCHASE_RECEIPT_ENDPOINT;
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.post(url, purchaseReceipt, {
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

  getStore() {
    return this.storage;
  }

  getApiInfo() {
    return this.http.get<any>(API_INFO_ENDPOINT);
  }
}
