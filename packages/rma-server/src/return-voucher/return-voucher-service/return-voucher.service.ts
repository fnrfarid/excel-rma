import {
  Injectable,
  NotImplementedException,
  HttpService,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from '../../system-settings/aggregates/settings/settings.service';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { PLEASE_RUN_SETUP } from '../../constants/messages';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  RETURN_VOUCHER_LIST_FIELD,
} from '../../constants/app-strings';
import { LIST_RETURN_VOUCHER_ENDPOINT } from '../../constants/routes';

@Injectable()
export class ReturnVoucherService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
  ) {}

  listReturnVoucher(offset, limit, req) {
    return this.settingsService.find().pipe(
      switchMap(settings => {
        if (!settings.authServerURL) {
          return throwError(new NotImplementedException(PLEASE_RUN_SETUP));
        }
        const headers = this.getAuthorizationHeaders(req.token);
        const params = {
          filters: JSON.stringify([['payment_type', '=', 'receive']]),
          fields: JSON.stringify(RETURN_VOUCHER_LIST_FIELD),
          limit_page_length: Number(limit),
          limit_start: Number(offset),
        };
        return this.http
          .get(settings.authServerURL + LIST_RETURN_VOUCHER_ENDPOINT, {
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
}
