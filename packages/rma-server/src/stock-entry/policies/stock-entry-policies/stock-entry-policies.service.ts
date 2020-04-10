import { Injectable, BadRequestException, HttpService } from '@nestjs/common';
import {
  StockEntryDto,
  StockEntryItemDto,
} from '../../stock-entry/stock-entry-dto';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { switchMap, map, mergeMap, concatMap } from 'rxjs/operators';
import { from, of, throwError } from 'rxjs';
import { FRAPPE_API_GET_DOCTYPE_COUNT } from '../../../constants/routes';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';

@Injectable()
export class StockEntryPoliciesService {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly settingsService: SettingsService,
    private readonly http: HttpService,
  ) {}

  validateStockEntry(payload: StockEntryDto, clientHttpRequest) {
    return this.settingsService.find().pipe(
      mergeMap(settings => {
        return this.validateStockSerials(
          payload.items,
          settings,
          clientHttpRequest,
        ).pipe(
          switchMap(isValid => {
            return of(isValid);
          }),
        );
      }),
    );
  }

  validateStockSerials(
    items: StockEntryItemDto[],
    settings,
    clientHttpRequest,
  ) {
    return from(items).pipe(
      mergeMap(item => {
        return from(
          this.serialNoService.count({
            serial_no: { $in: item.serial_no },
            warehouse: item.s_warehouse,
            item_code: item.item_code,
          }),
        ).pipe(
          concatMap(count => {
            if (count === item.serial_no.length) {
              return this.validateSerialsFromErp(
                item,
                settings,
                clientHttpRequest,
              );
            }
            return throwError(
              new BadRequestException(
                `Expected ${item.serial_no.length} serials for Item: ${item.item_name} at warehouse: ${item.s_warehouse}, found ${count}.`,
              ),
            );
          }),
        );
      }),
    );
  }

  validateSerialsFromErp(
    item: StockEntryItemDto,
    settings: ServerSettings,
    clientHttpRequest,
  ) {
    const frappeBody = {
      doctype: 'Serial No',
      filters: {
        serial_no: ['in', item.serial_no],
        warehouse: ['=', item.s_warehouse],
        item_code: ['=', item.item_code],
      },
    };
    return this.http
      .post(settings.authServerURL + FRAPPE_API_GET_DOCTYPE_COUNT, frappeBody, {
        headers: this.settingsService.getAuthorizationHeaders(
          clientHttpRequest.token,
        ),
      })
      .pipe(
        map(data => data.data),
        switchMap((response: { message: number }) => {
          if (response.message === 0) {
            return of(true);
          }
          return of(response.message);
        }),
      );
  }
}
