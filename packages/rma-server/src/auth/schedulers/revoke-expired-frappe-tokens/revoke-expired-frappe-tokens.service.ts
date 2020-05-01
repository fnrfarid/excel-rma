import {
  Injectable,
  HttpService,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import { from, of, Observable } from 'rxjs';
import { switchMap, mergeMap, retryWhen, take, delay } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { stringify } from 'querystring';
import { AxiosResponse } from 'axios';
import * as Agenda from 'agenda';

import { ClientTokenManagerService } from '../../aggregates/client-token-manager/client-token-manager.service';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import { OAUTH_BEARER_TOKEN_ENDPOINT } from '../../../constants/routes';
import {
  APP_WWW_FORM_URLENCODED,
  CONTENT_TYPE,
  HUNDRED_NUMBERSTRING,
} from '../../../constants/app-strings';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import {
  REVOKE_FRAPPE_TOKEN_SUCCESS,
  REVOKE_FRAPPE_TOKEN_ERROR,
} from '../../../constants/messages';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

export const REVOKE_EXPIRED_FRAPPE_TOKEN = 'REVOKE_EXPIRED_FRAPPE_TOKEN';
@Injectable()
export class RevokeExpiredFrappeTokensService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly settings: ServerSettingsService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly http: HttpService,
    private readonly errorLog: ErrorLogService,
  ) {}

  onModuleInit() {
    this.agenda.define(
      REVOKE_EXPIRED_FRAPPE_TOKEN,
      { concurrency: 1 },
      async job => {
        from(this.settings.find())
          .pipe(
            switchMap(settings => {
              const nowInServerTimeZone = new DateTime(
                settings.timeZone,
              ).toFormat('yyyy-MM-dd HH:mm:ss');
              return this.clientToken.getServiceAccountApiHeaders().pipe(
                switchMap(headers => {
                  return this.getFrappeTokens(
                    settings,
                    headers,
                    nowInServerTimeZone,
                  );
                }),
                mergeMap(moreTokens => from(moreTokens.data.data)),
                mergeMap(({ access_token }) => {
                  return this.revokeToken(settings, access_token);
                }),
              );
            }),
            retryWhen(errors => errors.pipe(delay(1000), take(3))),
          )
          .subscribe({
            next: success => {
              Logger.log(REVOKE_FRAPPE_TOKEN_SUCCESS, this.constructor.name);
            },
            error: error => {
              this.errorLog.createErrorLog(error);
              Logger.error(
                REVOKE_FRAPPE_TOKEN_ERROR,
                error,
                this.constructor.name,
              );
            },
          });
      },
    );

    this.agenda
      .every('15 minutes', REVOKE_EXPIRED_FRAPPE_TOKEN)
      .then(scheduled => {})
      .catch(error => {});
  }

  revokeToken(settings: ServerSettings, token: string): Observable<unknown> {
    return this.http.post(settings.revocationURL, stringify({ token }), {
      headers: {
        [CONTENT_TYPE]: APP_WWW_FORM_URLENCODED,
      },
    });
  }

  getFrappeTokens(
    settings: ServerSettings,
    headers,
    nowInServerTimeZone: string,
    iterationCount: number = 0,
  ): Observable<AxiosResponse> {
    const params = {
      fields: JSON.stringify(['access_token', 'name']),
      filters: JSON.stringify([
        ['refresh_token', '=', ''],
        ['expiration_time', '<', nowInServerTimeZone],
        ['status', '!=', 'Revoked'],
      ]),
      limit_page_length: HUNDRED_NUMBERSTRING,
      limit_start: Number(HUNDRED_NUMBERSTRING) * iterationCount,
    };

    return this.http
      .get(settings.authServerURL + OAUTH_BEARER_TOKEN_ENDPOINT, {
        headers,
        params,
      })
      .pipe(
        switchMap(resTokens => {
          if (resTokens.data.data.length === Number(HUNDRED_NUMBERSTRING)) {
            iterationCount++;
            return this.getFrappeTokens(
              settings,
              headers,
              nowInServerTimeZone,
              iterationCount,
            );
          }

          return of(resTokens as AxiosResponse);
        }),
      );
  }
}
