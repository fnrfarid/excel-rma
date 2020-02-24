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
  CREATE_PURCHASE_RECEIPT_BULK_ENDPOINT,
} from '../../constants/url-strings';
import { StorageService } from '../../api/storage/storage.service';
import { PurchaseReceipt } from '../../common/interfaces/purchase-receipt.interface';
import { JSON_BODY_MAX_SIZE } from '../../constants/app-string';
@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  constructor(private http: HttpClient, private storage: StorageService) {}

  getPurchaseInvoiceList(sortOrder, pageNumber = 0, pageSize = 10, query) {
    if (!sortOrder) sortOrder = { posting_date: 'desc' };
    if (!query) query = {};

    try {
      sortOrder = JSON.stringify(sortOrder);
    } catch (error) {
      sortOrder = JSON.stringify({ posting_date: 'desc' });
    }

    const url = LIST_PURCHASE_INVOICE_ENDPOINT;
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageNumber * pageSize).toString())
      .set('sort', sortOrder)
      .set('filter_query', JSON.stringify(query));
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
    return this.getHeaders().pipe(
      switchMap(headers => {
        if (JSON.stringify(purchaseReceipt).length < JSON_BODY_MAX_SIZE) {
          return this.http.post(
            CREATE_PURCHASE_RECEIPT_ENDPOINT,
            purchaseReceipt,
            {
              headers,
            },
          );
        }
        const blob = new Blob([JSON.stringify(purchaseReceipt)], {
          type: 'application/json',
        });
        const uploadData = new FormData();
        uploadData.append('file', blob, 'purchase_receipts');
        return this.http.post(
          CREATE_PURCHASE_RECEIPT_BULK_ENDPOINT,
          uploadData,
          { headers },
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

  getStore() {
    return this.storage;
  }

  getApiInfo() {
    return this.http.get<any>(API_INFO_ENDPOINT);
  }
}
