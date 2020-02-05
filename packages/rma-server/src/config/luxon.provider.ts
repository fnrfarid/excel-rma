import { Injectable, HttpService } from '@nestjs/common';
import { switchMap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { SettingsService } from '../system-settings/aggregates/settings/settings.service';
import { GET_TIME_ZONE_ENDPOINT } from '../constants/routes';

@Injectable()
export class LuxonProvider {
  constructor(
    private readonly settings: SettingsService,
    private readonly http: HttpService,
  ) {}

  toFrappeServer(time: Date): Observable<string> {
    return this.settings.find().pipe(
      switchMap(settings => {
        return this.http
          .get(settings.authServerURL + GET_TIME_ZONE_ENDPOINT)
          .pipe(map(res => res.data.message));
      }),
      map(message => {
        const timeZone = message.time_zone;
        const formattedTime = DateTime.fromJSDate(time)
          .setZone(timeZone)
          .toFormat('yyyy-MM-dd HH:mm:ss');
        return formattedTime;
      }),
    );
  }
}
