import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { stringify } from 'querystring';
import { switchMap, catchError, retry } from 'rxjs/operators';
import { parse } from 'url';
import {
  InAppBrowser,
  InAppBrowserObject,
} from '@ionic-native/in-app-browser/ngx';
import { BrowserTab } from '@ionic-native/browser-tab/ngx';
import { Platform } from '@ionic/angular';
import {
  STATE,
  EXPIRES_IN,
  ACCESS_TOKEN,
  REVOCATION_URL,
  TOKEN_URL,
  CLIENT_ID,
  REFRESH_TOKEN,
  LOGGED_IN,
  ONE_HOUR_IN_SECONDS_STRING,
  ID_TOKEN,
  SCOPE,
  REDIRECT_PREFIX,
  TWENTY_MINUTES_IN_NUMBER,
} from './constants/storage';
import { StorageService } from './storage.service';
import { FrappeOauth2Config } from './constants/oauth2config.interface';
import { FrappeConfigError } from './constants/frappe-config.error';
import { OAuthProviderClientCredentials } from './constants/frappe-oauth2config';
import { SPLASHSCREEN_KEY } from './constants/strings';

export const STATE_LENGTH = 32;

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  state: string;
  authWindow: InAppBrowserObject;
  config: FrappeOauth2Config;

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private iab: InAppBrowser,
    private platform: Platform,
    private browserTab: BrowserTab,
  ) {
    if (!this.config) {
      this.setupOauthConfig(OAuthProviderClientCredentials);
    }
  }

  setupOauthConfig(config: FrappeOauth2Config) {
    this.config = config;
    for (const key of Object.keys(this.config)) {
      this.storage.store(key, this.config[key]);
    }
  }

  initializeCodeGrant() {
    if (!this.config) {
      throw new FrappeConfigError('config missing');
    }

    this.processAuthorizeWindow();
  }

  generateAuthUrl() {
    this.state = this.generateState();
    this.storage.store(STATE, this.state);

    let url = this.config.authorizationUrl;
    url += '?scope=' + this.config.scope;
    url += '&response_type=code';
    url += '&client_id=' + this.config.clientId;
    url += '&redirect_uri=' + this.config.appUrl + REDIRECT_PREFIX;
    url += '&state=' + this.state;

    return of(url);
  }

  generateState() {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < STATE_LENGTH; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  getToken() {
    const expiration = localStorage.getItem(EXPIRES_IN);
    if (expiration) {
      const now = new Date();
      const expirationTime = new Date(expiration);

      // expire 20 min early
      expirationTime.setSeconds(
        expirationTime.getSeconds() - TWENTY_MINUTES_IN_NUMBER,
      );
      if (now < expirationTime) {
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        return of(accessToken);
      }
      return this.refreshToken();
    }
    return of();
  }

  refreshToken() {
    const tokenURL = localStorage.getItem(TOKEN_URL);
    const requestBody = {
      grant_type: 'refresh_token',
      refresh_token: localStorage.getItem(REFRESH_TOKEN),
      redirect_uri: this.config.appUrl + REDIRECT_PREFIX,
      client_id: localStorage.getItem(CLIENT_ID),
      // scope: localStorage.getItem(SCOPE),
    };

    return this.http
      .post<any>(tokenURL, stringify(requestBody), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(
        switchMap(bearerToken => {
          this.revokeToken(bearerToken.access_token, bearerToken.refresh_token);
          const expirationTime = new Date();
          const expiresIn =
            bearerToken.expires_in || ONE_HOUR_IN_SECONDS_STRING;
          expirationTime.setSeconds(
            expirationTime.getSeconds() + Number(expiresIn),
          );
          this.storage.store(EXPIRES_IN, expirationTime.toISOString());
          this.storage.store(ID_TOKEN, bearerToken.id_token);
          return of(bearerToken.access_token);
        }),
        retry(3),
        catchError(error => {
          this.revokeToken();
          this.storage.clear(LOGGED_IN);
          return of();
        }),
      );
  }

  revokeToken(accessToken?: string, refreshToken?: string) {
    const revocationURL = localStorage.getItem(REVOCATION_URL);
    const oldAccessToken = localStorage.getItem(ACCESS_TOKEN);
    this.http
      .post(revocationURL, stringify({ token: oldAccessToken }))
      .subscribe({
        next: success => {
          if (accessToken) {
            this.storage.store(ACCESS_TOKEN, accessToken);
          }
          if (refreshToken) {
            this.storage.store(REFRESH_TOKEN, refreshToken);
          }
        },
        error: error => {},
      });
  }

  processCode(url: string) {
    const savedState = localStorage.getItem(STATE);
    localStorage.removeItem(STATE);

    const urlParts = parse(url, true);
    const query = urlParts.query;
    const code = query.code as string;
    const state = query.state as string;
    const error = query.error;

    if (savedState !== state) {
      return;
    }

    if (error !== undefined) {
      return;
    }

    const req: any = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.appUrl + REDIRECT_PREFIX,
      client_id: localStorage.getItem(CLIENT_ID),
      scope: localStorage.getItem(SCOPE),
    };
    const tokenURL = localStorage.getItem(TOKEN_URL);
    navigator[SPLASHSCREEN_KEY].show();
    this.http
      .post<any>(tokenURL, stringify(req), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .subscribe({
        next: response => {
          const expiresIn = response.expires_in || ONE_HOUR_IN_SECONDS_STRING;
          const expirationTime = new Date();
          expirationTime.setSeconds(
            expirationTime.getSeconds() + Number(expiresIn),
          );

          this.storage.store(ACCESS_TOKEN, response.access_token);
          this.storage.store(REFRESH_TOKEN, response.refresh_token);
          this.storage.store(EXPIRES_IN, expirationTime.toISOString());
          this.storage.store(ID_TOKEN, response.id_token);
          this.storage.store(LOGGED_IN, 'true');
          this.refreshCordova();
        },
        error: tokenError => {
          this.storage.clear(LOGGED_IN);
          this.refreshCordova();
        },
      });
  }

  processAuthorizeWindow() {
    this.generateAuthUrl().subscribe({
      next: url => {
        if (this.platform.is('cordova')) {
          this.browserTab.isAvailable().then(isAvailable => {
            if (isAvailable) {
              this.browserTab.openUrl(url);
            } else {
              // open URL with InAppBrowser instead
              this.iab.create(url, '_system', { location: 'yes' });
            }
          });
        } else {
          // open URL with InAppBrowser instead
          this.iab.create(url, '_system', { location: 'yes' });
        }
      },
    });
  }

  logout() {
    this.storage.clear(LOGGED_IN);
    this.revokeToken();
  }

  refreshCordova() {
    if (this.platform.is('cordova')) {
      const initialUrl = window.location.href;
      navigator[SPLASHSCREEN_KEY].show();
      window.location.href = initialUrl;
    }
  }
}
