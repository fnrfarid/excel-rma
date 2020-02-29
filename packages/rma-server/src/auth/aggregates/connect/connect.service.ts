import {
  Injectable,
  HttpService,
  NotImplementedException,
  NotFoundException,
} from '@nestjs/common';
import { TokenCacheService } from '../../entities/token-cache/token-cache.service';
import { FrappeBearerTokenWebhookInterface } from '../../entities/token-cache/frappe-bearer-token-webhook.interface';
import { TokenCache } from '../../entities/token-cache/token-cache.entity';
import * as uuidv4 from 'uuid/v4';
import { ClientTokenManagerService } from '../client-token-manager/client-token-manager.service';
import { switchMap, map, mergeMap } from 'rxjs/operators';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { throwError, of } from 'rxjs';
import { PLEASE_RUN_SETUP } from '../../../constants/messages';
import {
  FRAPPE_API_GET_USER_INFO_ENDPOINT,
  FRAPPE_API_GET_USER_PERMISSION_ENDPOINT,
} from '../../../constants/routes';
import {
  FrappeUserInfoInterface,
  FrappeUserInfoRolesInterface,
} from '../../entities/token-cache/frappe-user-info.interface';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
} from '../../../constants/app-strings';
import { HUNDRED_NUMBERSTRING } from '../../../constants/app-strings';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';

@Injectable()
export class ConnectService {
  constructor(
    private readonly tokenCacheService: TokenCacheService,
    private readonly clientTokenManager: ClientTokenManagerService,
    private readonly http: HttpService,
    private readonly settingService: SettingsService,
    private readonly errorLogService: ErrorLogService,
  ) {}

  async createFrappeBearerToken(
    frappeBearerToken: FrappeBearerTokenWebhookInterface,
  ) {
    const token = await this.tokenCacheService.findOne({
      accessToken: frappeBearerToken.access_token,
    });
    if (!token) {
      const tokenObject = new TokenCache();
      const mappedToken: TokenCache = this.mapFrappeBearerToken(
        frappeBearerToken,
        tokenObject,
      );
      this.tokenCacheService
        .save(mappedToken)
        .then(success => {
          this.getUserRoles(frappeBearerToken);
          this.getUserTerritory(frappeBearerToken);
        })
        .catch(error => {});
    }
    return;
  }

  async updateFrappeBearerToken(
    frappeBearerToken: FrappeBearerTokenWebhookInterface,
  ) {
    const token = await this.tokenCacheService.findOne({
      accessToken: frappeBearerToken.access_token,
    });
    if (token) {
      this.tokenCacheService
        .updateOne(
          { accessToken: frappeBearerToken.access_token },
          { $set: { accessToken: frappeBearerToken.access_token } },
        )
        .then(success => {})
        .catch(error => {});
    }
    return;
  }

  getUserRoles(frappeToken: FrappeBearerTokenWebhookInterface) {
    return this.settingService
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings.authServerURL) {
            return throwError(new NotImplementedException(PLEASE_RUN_SETUP));
          }

          if (settings.serviceAccountUser === frappeToken.user) {
            return this.getRolesRequest(settings, frappeToken, {
              accessToken: frappeToken.access_token,
            });
          }
          return this.clientTokenManager.getClientToken().pipe(
            switchMap(token => {
              return this.getRolesRequest(settings, frappeToken, token);
            }),
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {
          this.errorLogService.createErrorLog(err, 'User', 'token_cache', {});
        },
      });
  }

  getUserTerritory(frappeToken: FrappeBearerTokenWebhookInterface) {
    return this.settingService
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings.authServerURL) {
            return throwError(new NotImplementedException(PLEASE_RUN_SETUP));
          }

          if (settings.serviceAccountUser === frappeToken.user) {
            return this.getTerritoryRequest(settings, frappeToken, {
              accessToken: frappeToken.access_token,
            });
          }

          return this.clientTokenManager.getClientToken().pipe(
            switchMap(token => {
              return this.getTerritoryRequest(settings, frappeToken, token);
            }),
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {
          this.errorLogService.createErrorLog(err, 'User', 'token_cache', {});
        },
      });
  }

  mapFrappeBearerToken(
    frappeBearerToken: FrappeBearerTokenWebhookInterface,
    tokenObject: TokenCache,
  ): TokenCache {
    tokenObject.email = frappeBearerToken.user;
    tokenObject.status = frappeBearerToken.status;
    tokenObject.uuid = uuidv4();
    tokenObject.accessToken = frappeBearerToken.access_token;
    tokenObject.refreshToken = frappeBearerToken.refresh_token;
    const now = new Date().getTime() / 1000;
    tokenObject.exp = now + 3600;
    return tokenObject;
  }

  getAuthorizationHeaders(accessToken) {
    const headers: any = {};
    headers[AUTHORIZATION] = BEARER_HEADER_VALUE_PREFIX + accessToken;
    return headers;
  }

  mapUserRoles(roles: FrappeUserInfoRolesInterface[]) {
    const userRoles = [];
    roles.filter(eachRole => {
      userRoles.push(eachRole.role);
    });
    return userRoles;
  }

  mapUserTerritory(territory: { for_value: string }[]) {
    const userTerritory = [];
    territory.filter(eachTerritory => {
      userTerritory.push(eachTerritory.for_value);
    });
    return userTerritory;
  }

  tokenDeleted(accessToken: string) {
    return this.tokenCacheService.deleteMany({ accessToken });
  }

  async findCachedToken(params) {
    const token = await this.tokenCacheService.findOne(params);
    if (!token) throw new NotFoundException();
    return token;
  }

  getRolesRequest(
    settings: ServerSettings,
    frappeToken: FrappeBearerTokenWebhookInterface,
    token: { accessToken: string },
  ) {
    return this.http
      .get(
        settings.authServerURL +
          FRAPPE_API_GET_USER_INFO_ENDPOINT +
          frappeToken.user,
        { headers: this.getAuthorizationHeaders(token.accessToken) },
      )
      .pipe(
        map(data => data.data.data),
        mergeMap((userInfo: FrappeUserInfoInterface) => {
          const roles = this.mapUserRoles(userInfo.roles);
          this.tokenCacheService
            .updateMany(
              { email: frappeToken.user },
              {
                $set: {
                  roles,
                  name: userInfo.first_name,
                  fullName: userInfo.full_name,
                },
              },
            )
            .then(success => {})
            .catch(error => {});
          return of({});
        }),
      );
  }

  getTerritoryRequest(
    settings: ServerSettings,
    frappeToken: FrappeBearerTokenWebhookInterface,
    token: { accessToken: string },
  ) {
    const params = {
      fields: JSON.stringify([
        ['allow', '=', 'Territory'],
        ['user', '=', frappeToken.user],
      ]),
      filters: JSON.stringify(['for_value']),
      limit_page_length: HUNDRED_NUMBERSTRING,
    };
    return this.http
      .get(settings.authServerURL + FRAPPE_API_GET_USER_PERMISSION_ENDPOINT, {
        headers: this.getAuthorizationHeaders(token.accessToken),
        params,
      })
      .pipe(
        map(data => data.data.data),
        mergeMap((userTerritory: { for_value: string }[]) => {
          const territory = this.mapUserTerritory(userTerritory);
          this.tokenCacheService
            .updateMany(
              { email: frappeToken.user },
              {
                $set: { territory },
              },
            )
            .then(success => {})
            .catch(error => {});
          return of({});
        }),
      );
  }
}
