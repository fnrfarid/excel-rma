import { Injectable } from '@angular/core';
import { switchMap, map } from 'rxjs/operators';
import { HttpParams, HttpClient } from '@angular/common/http';
import {
  RELAY_LIST_COMPANIES_ENDPOINT,
  GET_SETTINGS_ENDPOINT,
  UPDATE_SETTINGS_ENDPOINT,
  GET_USER_PROFILE_ROLES,
} from '../constants/url-strings';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
} from '../constants/storage';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private readonly http: HttpClient) {}

  relayCompaniesOperation() {
    return switchMap(value => {
      const params = new HttpParams({
        fromObject: {
          fields: '["*"]',
          filters: `[["name","like","%${value}%"]]`,
        },
      });
      return this.http
        .get<{ data: unknown[] }>(RELAY_LIST_COMPANIES_ENDPOINT, {
          headers: {
            [AUTHORIZATION]:
              BEARER_TOKEN_PREFIX + localStorage.getItem(ACCESS_TOKEN),
          },
          params,
        })
        .pipe(map(res => res.data));
    });
  }

  getSettings() {
    return this.http.get<any>(GET_SETTINGS_ENDPOINT, {
      headers: {
        [AUTHORIZATION]:
          BEARER_TOKEN_PREFIX + localStorage.getItem(ACCESS_TOKEN),
      },
    });
  }

  checkUserProfile() {
    return this.http.get<{ roles: string[] }>(GET_USER_PROFILE_ROLES, {
      headers: {
        [AUTHORIZATION]:
          BEARER_TOKEN_PREFIX + localStorage.getItem(ACCESS_TOKEN),
      },
    });
  }

  updateSettings(
    authServerURL: string,
    appURL: string,
    defaultCompany: string,
    frontendClientId: string,
    backendClientId: string,
    serviceAccountUser: string,
    serviceAccountSecret: string,
  ) {
    return this.http.post<any>(
      UPDATE_SETTINGS_ENDPOINT,
      {
        authServerURL,
        appURL,
        defaultCompany,
        frontendClientId,
        backendClientId,
        serviceAccountUser,
        serviceAccountSecret,
      },
      {
        headers: {
          [AUTHORIZATION]:
            BEARER_TOKEN_PREFIX + localStorage.getItem(ACCESS_TOKEN),
        },
      },
    );
  }
}
