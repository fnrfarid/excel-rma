import { Injectable, HttpService } from '@nestjs/common';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import { forkJoin, from, Observable, of } from 'rxjs';
import {
  switchMap,
  map,
  catchError,
  concatMap,
  toArray,
  flatMap,
} from 'rxjs/operators';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  FRAPPE_API_GET_DOCTYPE_COUNT,
  API_RESOURCE,
} from '../../../constants/routes';

@Injectable()
export class SyncAggregateService {
  constructor(
    private readonly settings: ServerSettingsService,
    private readonly http: HttpService,
    private readonly client: ClientTokenManagerService,
  ) {}

  syncDocTypeToEntity(
    doctype: string,
    chunk = 20,
    fields = '',
    filters = '[]',
    countFilters = '{}',
  ): Observable<unknown> {
    return forkJoin({
      settings: from(this.settings.find()),
      headers: from(this.client.getServiceAccountApiHeaders()),
    }).pipe(
      switchMap(({ settings, headers }) => {
        return this.http
          .get(settings.authServerURL + FRAPPE_API_GET_DOCTYPE_COUNT, {
            headers,
            params: { doctype, filters: countFilters },
          })
          .pipe(
            switchMap(resCount => {
              const { message: count } = resCount.data;
              return from([
                ...Array(Math.round((count as number) / chunk)).keys(),
              ]).pipe(
                concatMap(index => {
                  return this.http
                    .get(settings.authServerURL + API_RESOURCE + doctype, {
                      headers,
                      params: {
                        limit_page_length: chunk,
                        limit_start: chunk * index,
                        fields,
                        filters,
                      },
                    })
                    .pipe(map(res => res.data.data));
                }),
                flatMap(array => array),
                toArray(),
              );
            }),
          );
      }),
      catchError(error => {
        return of({
          error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
      }),
    );
  }
}
