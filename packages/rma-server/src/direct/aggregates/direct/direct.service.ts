import {
  Injectable,
  BadRequestException,
  HttpStatus,
  HttpService,
  BadGatewayException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { switchMap, map, catchError } from 'rxjs/operators';
import { from, throwError, of } from 'rxjs';
import * as uuidv4 from 'uuid/v4';
import { stringify } from 'querystring';
import {
  INVALID_STATE,
  INVALID_FRAPPE_TOKEN,
} from '../../../constants/messages';
import { RequestStateService } from '../../entities/request-state/request-state.service';
import { RequestState } from '../../entities/request-state/request-state.entity';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { FrappeTokenService } from '../../entities/frappe-token/frappe-token.service';
import {
  REDIRECT_ENDPOINT,
  TWENTY_MINUTES_IN_SECONDS,
} from '../../../constants/app-strings';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { FrappeToken } from '../../entities/frappe-token/frappe-token.entity';
import { BearerToken } from './bearer-token.interface';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';

@Injectable()
export class DirectService {
  private localState = new RequestState();

  constructor(
    private readonly requestStateService: RequestStateService,
    private readonly settingService: SettingsService,
    private readonly frappeTokenService: FrappeTokenService,
    private readonly http: HttpService,
  ) {}

  connectClientForUser(redirect: string) {
    return from(
      this.requestStateService.save({
        uuid: uuidv4(),
        redirect,
        creation: new Date(),
      }),
    ).pipe(
      switchMap(state => {
        const encodedState = state.uuid;
        return this.settingService.find().pipe(
          switchMap(settings => {
            let redirectTo =
              settings.authorizationURL +
              '?client_id=' +
              settings.backendClientId;
            redirectTo +=
              '&redirect_uri=' +
              encodeURIComponent(settings.appURL + REDIRECT_ENDPOINT);
            redirectTo += '&scope=' + settings.scope.join('%20');
            redirectTo += '&response_type=code';
            redirectTo += '&state=' + encodedState;
            return of({ redirect: redirectTo });
          }),
        );
      }),
    );
  }

  oauth2callback(res: Response, code: string, state: string) {
    this.settingService
      .find()
      .pipe(
        switchMap(settings => {
          return from(this.requestStateService.findOne({ uuid: state })).pipe(
            switchMap(requestState => {
              if (!requestState) {
                return throwError(new BadRequestException(INVALID_STATE));
              }

              this.localState = requestState;
              const requestBody = {
                client_id: settings.backendClientId,
                code,
                grant_type: 'authorization_code',
                scope: settings.scope.join('%20'),
                redirect_uri: settings.appURL + REDIRECT_ENDPOINT,
              };

              return this.http.post(settings.tokenURL, stringify(requestBody), {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              });
            }),
            map(response => response.data),
            switchMap(token => {
              return this.saveToken(token, settings);
            }),
          );
        }),
      )
      .subscribe({
        next: response => {
          const redirect = this.localState.redirect || '/';

          this.deleteRequestState(this.localState);

          return res.redirect(HttpStatus.FOUND, redirect);
        },
        error: error => {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR);
          return res.json({ error: error.message });
        },
      });
  }

  saveToken(token: BearerToken, settings: ServerSettings) {
    let username;
    if (!token || !token.access_token) {
      return throwError(new BadGatewayException(INVALID_FRAPPE_TOKEN));
    }
    return this.http
      .get(settings.profileURL, {
        headers: {
          authorization: 'Bearer ' + token.access_token,
        },
      })
      .pipe(
        map(res => res.data),
        switchMap(profile => {
          username = profile.email;
          return from(this.frappeTokenService.findOne({ username }));
        }),
        switchMap((localToken: any) => {
          // Set Saved Token Expiration Time
          const expirationTime = new Date();
          expirationTime.setSeconds(
            expirationTime.getSeconds() + (token.expires_in || 3600),
          );

          if (!localToken) {
            return from(
              this.frappeTokenService.save({
                uuid: uuidv4(),
                accessToken: token.access_token,
                refreshToken: token.refresh_token,
                idToken: token.id_token,
                username,
                expirationTime,
              }),
            );
          }

          this.revokeToken(localToken.accessToken);
          localToken.uuid = uuidv4();
          localToken.username = username;
          localToken.accessToken = token.access_token;
          localToken.refreshToken = token.refresh_token;
          localToken.expirationTime = expirationTime;
          return from(localToken.save());
        }),
      );
  }

  deleteRequestState(requestState: RequestState) {
    from(requestState.remove()).subscribe({
      next: success => {},
      error: error => {},
    });
  }

  revokeToken(accessToken: string) {
    this.settingService
      .find()
      .pipe(
        switchMap(settings => {
          return this.http.post(
            settings.revocationURL,
            stringify({ token: accessToken }),
            {
              headers: {
                'content-type': 'application/x-www-form-urlencoded',
              },
            },
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: error => {},
      });
  }

  getUserAccessToken(username: string) {
    return from(this.frappeTokenService.findOne({ username })).pipe(
      switchMap(token => {
        const expiration = token.expirationTime;
        expiration.setSeconds(
          expiration.getSeconds() - TWENTY_MINUTES_IN_SECONDS,
        );

        if (new Date() > expiration) {
          return this.refreshToken(token);
        }

        return of(token);
      }),
    );
  }

  refreshToken(frappeToken: FrappeToken) {
    return this.settingService.find().pipe(
      switchMap(settings => {
        const requestBody = {
          grant_type: 'refresh_token',
          refresh_token: frappeToken.refreshToken,
          client_id: settings.backendClientId,
          redirect_uri: settings.appURL + REDIRECT_ENDPOINT,
          // scope: frappeClient.scope.join('%20'),
        };
        return this.http
          .post(settings.tokenURL, stringify(requestBody), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .pipe(
            map(res => res.data),
            catchError(err => {
              this.revokeToken(frappeToken.accessToken);
              frappeToken
                .remove()
                .then(success => {})
                .catch(error => {});

              return throwError(new ForbiddenException(INVALID_FRAPPE_TOKEN));
            }),
            switchMap(bearerToken => {
              this.revokeToken(frappeToken.accessToken);
              return this.saveToken(bearerToken, settings);
            }),
          );
      }),
    );
  }

  getProfile(token: TokenCache, query) {
    let localSettings: ServerSettings;
    let bearerToken: FrappeToken;

    return this.settingService.find().pipe(
      switchMap(settings => {
        localSettings = settings;
        if (query && query.from_backend === '1') {
          return this.getUserAccessToken(token.email);
        }
        return of(token);
      }),
      switchMap(tokenForUse => {
        if (tokenForUse instanceof FrappeToken) {
          bearerToken = tokenForUse;
        }
        return this.http
          .get(localSettings.profileURL, {
            headers: {
              authorization: 'Bearer ' + tokenForUse.accessToken,
            },
          })
          .pipe(map(res => res.data));
      }),
      catchError(error => {
        if (bearerToken instanceof FrappeToken) {
          bearerToken
            .remove()
            .then()
            .catch();
        }
        return throwError(new ForbiddenException(INVALID_FRAPPE_TOKEN));
      }),
    );
  }

  async verifyBackendConnection(username: string) {
    return (await this.frappeTokenService.findOne({ username })) ? true : false;
  }
}
