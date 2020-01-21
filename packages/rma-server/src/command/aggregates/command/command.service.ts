import {
  Injectable,
  HttpService,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { throwError } from 'rxjs';
import {
  INVALID_HTTP_METHOD,
  INVALID_REQUEST,
} from '../../../constants/messages';
import {
  ACCEPT,
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
} from '../../../constants/app-strings';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { HttpRequestMethod } from '../../../constants/http-method.enum';

@Injectable()
export class CommandService {
  constructor(
    private readonly http: HttpService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly settings: SettingsService,
  ) {}

  makeRequest(
    method: HttpRequestMethod,
    requestUrl: string[],
    accessToken: string,
    params: unknown,
    data: unknown,
    clientToken: boolean = false,
  ) {
    if (clientToken && accessToken && !requestUrl.length) {
      return throwError(new BadRequestException(INVALID_REQUEST));
    }
    return this.settings.find().pipe(
      switchMap(settings => {
        const url = settings.authServerURL + '/' + requestUrl[0];
        if (clientToken) {
          return this.clientToken.getClientToken().pipe(
            switchMap(token => {
              return this.relayCommand(
                method,
                url,
                token.accessToken,
                params,
                data,
              );
            }),
          );
        }
        return this.relayCommand(method, url, accessToken, params, data);
      }),
      catchError(error => {
        return throwError(new InternalServerErrorException(error));
      }),
    );
  }

  relayCommand(
    method: HttpRequestMethod,
    url: string,
    accessToken: string,
    params: unknown,
    data: unknown,
  ) {
    const headers = {
      [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
      [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
      [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + accessToken,
    };

    switch (method) {
      case HttpRequestMethod.GET:
        return this.http
          .get(url, {
            headers,
            params,
          })
          .pipe(map(res => res.data));

      case HttpRequestMethod.POST:
        return this.http
          .post(url, data, {
            headers,
            params,
          })
          .pipe(map(res => res.data));

      case HttpRequestMethod.PUT:
        return this.http
          .put(url, data, {
            headers,
            params,
          })
          .pipe(map(res => res.data));

      case HttpRequestMethod.PATCH:
        return this.http
          .patch(url, data, {
            headers,
            params,
          })
          .pipe(map(res => res.data));

      case HttpRequestMethod.DELETE:
        return this.http
          .delete(url, {
            headers,
            params,
          })
          .pipe(map(res => res.data));

      default:
        return throwError(new BadRequestException(INVALID_HTTP_METHOD));
    }
  }
}
