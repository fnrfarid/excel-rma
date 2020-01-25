import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CLIENT_ID,
  REDIRECT_URI,
  SILENT_REFRESH_REDIRECT_URI,
  LOGIN_URL,
  ISSUER_URL,
  APP_URL,
  AUTH_SERVER_URL,
  LOGGED_IN,
  CALLBACK_ENDPOINT,
  SILENT_REFRESH_ENDPOINT,
  DEFAULT_COMPANY,
  DEFAULT_CURRENCY_KEY,
  COUNTRY,
  TIME_ZONE,
} from './constants/storage';
import { StorageService } from './api/storage/storage.service';
import { GET_GLOBAL_DEFAULTS_ENDPOINT } from './constants/url-strings';

@Injectable()
export class AppService {
  messageUrl = '/api/info'; // URL to web api

  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {}

  /** GET message from the server */
  getMessage(): Observable<any> {
    return this.http.get<any>(this.messageUrl);
  }

  setInfoLocalStorage(response) {
    this.storage
      .setItem(CLIENT_ID, response.frontendClientId)
      .then(() =>
        this.storage.setItem(REDIRECT_URI, response.appURL + CALLBACK_ENDPOINT),
      )
      .then(() =>
        this.storage.setItem(
          SILENT_REFRESH_REDIRECT_URI,
          response.appURL + SILENT_REFRESH_ENDPOINT,
        ),
      )
      .then(() => this.storage.setItem(LOGIN_URL, response.authorizationURL))
      .then(() => this.storage.setItem(ISSUER_URL, response.authServerURL))
      .then(() => this.storage.setItem(APP_URL, response.appURL))
      .then(() => this.storage.setItem(AUTH_SERVER_URL, response.authServerURL))
      .then(() => this.storage.setItem(LOGGED_IN, false))
      .then(() =>
        this.storage.setItem(DEFAULT_COMPANY, response.defaultCompany),
      );
  }

  generateRandomString(length: number) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  getStorage() {
    return this.storage;
  }

  getGlobalDefault() {
    return this.http.get(GET_GLOBAL_DEFAULTS_ENDPOINT).subscribe({
      next: (success: {
        default_currency: string;
        country: string;
        time_zone: string;
      }) => {
        this.storage
          .setItem(DEFAULT_CURRENCY_KEY, success.default_currency)
          .then(() => this.storage.setItem(COUNTRY, success.country))
          .then(() => this.storage.setItem(TIME_ZONE, success.time_zone))
          .then(() => {});
      },
      error: err => {},
    });
  }
}
