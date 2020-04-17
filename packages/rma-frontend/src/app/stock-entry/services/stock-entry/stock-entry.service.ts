import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../../../api/storage/storage.service';
import { from } from 'rxjs';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
} from '../../../constants/storage';
import { map, switchMap } from 'rxjs/operators';
import {
  STOCK_ENTRY_CREATE_ENDPOINT,
  STOCK_ENTRY_CREATE_FROM_FILE_ENDPOINT,
} from '../../../constants/url-strings';
import { MaterialTransferDto } from '../../material-transfer/material-transfer.datasource';
import { JSON_BODY_MAX_SIZE } from '../../../constants/app-string';

@Injectable({
  providedIn: 'root',
})
export class StockEntryService {
  constructor(private http: HttpClient, private storage: StorageService) {}

  createMaterialTransfer(body: MaterialTransferDto) {
    return this.getHeaders().pipe(
      switchMap(headers => {
        if (JSON.stringify(body).length < JSON_BODY_MAX_SIZE) {
          return this.http.post(STOCK_ENTRY_CREATE_ENDPOINT, body, {
            headers,
          });
        }
        const blob = new Blob([JSON.stringify(body)], {
          type: 'application/json',
        });
        const uploadData = new FormData();
        uploadData.append('file', blob, 'purchase_receipts');
        return this.http.post(
          STOCK_ENTRY_CREATE_FROM_FILE_ENDPOINT,
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
}
