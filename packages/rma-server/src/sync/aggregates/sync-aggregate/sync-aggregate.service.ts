import { Injectable, HttpService } from '@nestjs/common';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import { forkJoin, from, Observable, range } from 'rxjs';
import { switchMap, map, mergeMap, toArray } from 'rxjs/operators';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  FRAPPE_API_GET_DOCTYPE_COUNT,
  API_RESOURCE,
} from '../../../constants/routes';

@Injectable()
export class SyncAggregateService {
  private retryCount = 0;
  constructor(
    private readonly settings: ServerSettingsService,
    private readonly http: HttpService,
    private readonly client: ClientTokenManagerService,
  ) {}

  syncDocTypeToEntity(doctype: string): Observable<unknown> {
    return forkJoin({
      settings: from(this.settings.find()),
      headers: from(this.client.getServiceAccountApiHeaders()),
    }).pipe(
      switchMap(({ settings, headers }) => {
        return this.http
          .get(settings.authServerURL + FRAPPE_API_GET_DOCTYPE_COUNT, {
            headers,
            params: { doctype },
          })
          .pipe(
            mergeMap(count => {
              this.retryCount = count.data?.message;
              return range(0, this.retryCount).pipe(
                mergeMap(() => {
                  return this.http.get(
                    settings.authServerURL + API_RESOURCE + 'ToDo',
                    {
                      headers,
                    },
                  );
                }),
                map(res => res.data.data),
                toArray(),
              );
            }),
          );
      }),
    );
  }
}
