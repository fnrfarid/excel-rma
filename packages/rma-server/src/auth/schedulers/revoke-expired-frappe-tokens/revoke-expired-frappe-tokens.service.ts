import { Injectable, HttpService, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { from } from 'rxjs';
import { switchMap, map, retry, mergeMap } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { stringify } from 'querystring';

import { ClientTokenManagerService } from '../../aggregates/client-token-manager/client-token-manager.service';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import {
  OAUTH_BEARER_TOKEN_ENDPOINT,
  GET_TIME_ZONE_ENDPOINT,
} from '../../../constants/routes';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  NONE_PYTHON_STRING,
  APP_WWW_FORM_URLENCODED,
  CONTENT_TYPE,
  HUNDRED_NUMBERSTRING,
} from '../../../constants/app-strings';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { TokenCache } from '../../entities/token-cache/token-cache.entity';

export const FRAPPE_TOKEN_CLEANUP_CRON_STRING = '0 */15 * * * *';

@Injectable()
export class RevokeExpiredFrappeTokensService implements OnModuleInit {
  constructor(
    private readonly settings: ServerSettingsService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly http: HttpService,
  ) {}

  onModuleInit() {
    let iterationCount = 0;
    let tokenCache: TokenCache;
    const job = new CronJob(FRAPPE_TOKEN_CLEANUP_CRON_STRING, async () => {
      from(this.settings.find())
        .pipe(
          switchMap(settings => {
            return this.http
              .get(settings.authServerURL + GET_TIME_ZONE_ENDPOINT)
              .pipe(
                map(resTZ => resTZ.data.message),
                switchMap(({ time_zone }) => {
                  const nowInServerTimeZone = new DateTime(time_zone).toFormat(
                    'yyyy-MM-dd HH:mm:ss',
                  );
                  return this.clientToken.getClientToken().pipe(
                    switchMap(token => {
                      tokenCache = token;
                      return this.getFrappeTokens(
                        settings,
                        tokenCache,
                        nowInServerTimeZone,
                        iterationCount,
                      );
                    }),
                    mergeMap(resTokens => {
                      if (
                        resTokens.data.data.length > 0 &&
                        resTokens.data.data.length <
                          Number(HUNDRED_NUMBERSTRING)
                      ) {
                        return from(resTokens.data.data);
                      }

                      iterationCount++;
                      return this.getFrappeTokens(
                        settings,
                        tokenCache,
                        nowInServerTimeZone,
                        iterationCount,
                      ).pipe(
                        switchMap(moreTokens => from(moreTokens.data.data)),
                      );
                    }),
                    mergeMap(({ access_token }) => {
                      return this.revokeToken(settings, access_token);
                    }),
                  );
                }),
              );
          }),
          retry(3),
        )
        .subscribe({
          next: success => {},
          error: error => {},
        });
    });
    job.start();
  }

  revokeToken(settings: ServerSettings, token: string) {
    return this.http.post(settings.revocationURL, stringify({ token }), {
      headers: {
        [CONTENT_TYPE]: APP_WWW_FORM_URLENCODED,
      },
    });
  }

  getFrappeTokens(
    settings: ServerSettings,
    token: TokenCache,
    nowInServerTimeZone: string,
    iterationCount: number,
  ) {
    const headers = {
      [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
    };

    const params = {
      fields: JSON.stringify(['access_token', 'name']),
      filters: JSON.stringify([
        ['refresh_token', '=', ''],
        ['expiration_time', '<', nowInServerTimeZone],
        ['status', '!=', 'Revoked'],
      ]),
      limit_page_length: NONE_PYTHON_STRING,
      limit_start: Number(HUNDRED_NUMBERSTRING) * iterationCount,
    };

    return this.http.get(settings.authServerURL + OAUTH_BEARER_TOKEN_ENDPOINT, {
      headers,
      params,
    });
  }
}
