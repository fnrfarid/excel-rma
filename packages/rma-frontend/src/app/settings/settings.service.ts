import { Injectable } from '@angular/core';
import { switchMap, map } from 'rxjs/operators';
import { HttpParams, HttpClient } from '@angular/common/http';
import {
  RELAY_LIST_COMPANIES_ENDPOINT,
  GET_SETTINGS_ENDPOINT,
  UPDATE_SETTINGS_ENDPOINT,
  GET_USER_PROFILE_ROLES,
  RELAY_LIST_PRICELIST_ENDPOINT,
  LIST_TERRITORIES_ENDPOINT,
} from '../constants/url-strings';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
} from '../constants/storage';
import { from } from 'rxjs';
import { StorageService } from '../api/storage/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {}

  relayCompaniesOperation() {
    return switchMap(value => {
      const params = new HttpParams({
        fromObject: {
          fields: '["*"]',
          filters: `[["name","like","%${value}%"]]`,
        },
      });
      return this.getHeaders().pipe(
        switchMap(headers => {
          return this.http
            .get<{ data: unknown[] }>(RELAY_LIST_COMPANIES_ENDPOINT, {
              headers,
              params,
            })
            .pipe(map(res => res.data));
        }),
      );
    });
  }

  relaySellingPriceListsOperation() {
    return switchMap(value => {
      const params = new HttpParams({
        fromObject: {
          fields: '["*"]',
          filters: `[["name","like","%${value}%"],["selling","=",1]]`,
        },
      });
      return this.getHeaders().pipe(
        switchMap(headers => {
          return this.http
            .get<{ data: unknown[] }>(RELAY_LIST_PRICELIST_ENDPOINT, {
              headers,
              params,
            })
            .pipe(map(res => res.data));
        }),
      );
    });
  }

  getSettings() {
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(GET_SETTINGS_ENDPOINT, {
          headers,
        });
      }),
    );
  }

  checkUserProfile(accessToken?: string) {
    if (accessToken) {
      return this.http.get<{ roles: string[] }>(GET_USER_PROFILE_ROLES, {
        headers: {
          [AUTHORIZATION]: BEARER_TOKEN_PREFIX + accessToken,
        },
      });
    }
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get<{ roles: string[] }>(GET_USER_PROFILE_ROLES, {
          headers,
        });
      }),
    );
  }

  updateSettings(
    authServerURL: string,
    appURL: string,
    defaultCompany: string,
    frontendClientId: string,
    backendClientId: string,
    serviceAccountUser: string,
    serviceAccountSecret: string,
    sellingPriceList: string,
  ) {
    return this.getHeaders().pipe(
      switchMap(headers => {
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
            sellingPriceList,
          },
          { headers },
        );
      }),
    );
  }

  findTerritories(
    filter: string,
    sortOrder: string,
    pageIndex: number,
    pageSize: number,
  ) {
    const params = new HttpParams()
      .set('limit', pageSize.toString())
      .set('offset', (pageIndex * pageSize).toString())
      .set('search', filter)
      .set('sort', sortOrder);
    return this.getHeaders().pipe(
      switchMap(headers => {
        return this.http.get(LIST_TERRITORIES_ENDPOINT, {
          headers,
          params,
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
}
