import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  HandleError,
  HttpErrorHandler,
} from '../../common/interfaces/services/http-error-handler/http-error-handler.service';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
} from 'src/app/constants/storage';

@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  handleError: HandleError;

  constructor(httpErrorHandler: HttpErrorHandler, private http: HttpClient) {
    this.handleError = httpErrorHandler.createHandleError('ListingService');
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
    return this.http.get(url, {
      params,
      headers: this.getAuthorizationHeaders(),
    });
  }

  getAuthorizationHeaders() {
    const headers = {};
    headers[AUTHORIZATION] = `${BEARER_TOKEN_PREFIX}${localStorage.getItem(
      ACCESS_TOKEN,
    )}`;
    return headers;
  }
}
