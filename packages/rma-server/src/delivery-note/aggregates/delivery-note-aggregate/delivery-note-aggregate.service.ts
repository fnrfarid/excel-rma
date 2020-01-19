import {
  Injectable,
  HttpService,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { throwError, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  ERPNEXT_API_WAREHOUSE_ENDPOINT,
  LIST_DELIVERY_NOTE_ENDPOINT,
} from '../../../constants/routes';
import { PLEASE_RUN_SETUP } from '../../../constants/messages';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  DELIVERY_NOTE_LIST_FIELD,
} from '../../../constants/app-strings';

@Injectable()
export class DeliveryNoteAggregateService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
    private readonly clientToken: ClientTokenManagerService,
  ) {}

  listDeliveryNote(offset, limit, req) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        if (!settings.authServerURL) {
          return throwError(new NotImplementedException(PLEASE_RUN_SETUP));
        }
        const headers = this.getAuthorizationHeaders(req.token);
        const params = {
          filters: JSON.stringify([['is_return', '=', '1']]),
          fields: JSON.stringify(DELIVERY_NOTE_LIST_FIELD),
          limit_page_length: Number(limit),
          limit_start: Number(offset),
        };
        return this.http
          .get(settings.authServerURL + LIST_DELIVERY_NOTE_ENDPOINT, {
            params,
            headers,
          })
          .pipe(
            switchMap(response => {
              return of(response.data.data);
            }),
          );
      }),
      catchError(error => {
        return throwError(new BadRequestException(error));
      }),
    );
  }

  getAuthorizationHeaders(token) {
    return {
      [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
    };
  }

  relayListWarehouses(query) {
    return this.clientToken.getClientToken().pipe(
      switchMap(token => {
        return this.settingsService.find().pipe(
          switchMap(settings => {
            const url = settings.authServerURL + ERPNEXT_API_WAREHOUSE_ENDPOINT;
            return this.http
              .get(url, {
                headers: this.getAuthorizationHeaders(token),
                params: query,
              })
              .pipe(map(res => res.data));
          }),
        );
      }),
    );
  }
}
