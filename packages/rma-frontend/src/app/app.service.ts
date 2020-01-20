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
  IN_LOGIN,
  AUTH_SERVER_URL,
  LOGGED_IN,
  CALLBACK_ENDPOINT,
  SILENT_REFRESH_ENDPOINT,
  DEFAULT_COMPANY,
} from './constants/storage';

@Injectable()
export class AppService {
  messageUrl = '/api/info'; // URL to web api

  constructor(private http: HttpClient) {}

  /** GET message from the server */
  getMessage(): Observable<any> {
    return this.http.get<any>(this.messageUrl);
  }

  setInfoLocalStorage(response) {
    localStorage.setItem(CLIENT_ID, response.frontendClientId);
    localStorage.setItem(REDIRECT_URI, response.appURL + CALLBACK_ENDPOINT);
    localStorage.setItem(
      SILENT_REFRESH_REDIRECT_URI,
      response.appURL + SILENT_REFRESH_ENDPOINT,
    );
    localStorage.setItem(LOGIN_URL, response.authorizationURL);
    localStorage.setItem(ISSUER_URL, response.authServerURL);
    localStorage.setItem(APP_URL, response.appURL);
    localStorage.setItem(AUTH_SERVER_URL, response.authServerURL);
    localStorage.setItem(LOGGED_IN, 'false');
    localStorage.setItem(DEFAULT_COMPANY, response.defaultCompany);
    JSON.parse(localStorage.getItem(IN_LOGIN))
      ? null
      : localStorage.removeItem(IN_LOGIN);
  }

  login(url, body) {
    return this.http.post(url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
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
}
