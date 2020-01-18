import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { GET_USER_PROFILE_ROLES } from '../../constants/url-strings';
import { SYSTEM_MANAGER } from '../../constants/app-string';
import {
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  ACCESS_TOKEN,
} from '../../constants/storage';

@Injectable({
  providedIn: 'root',
})
export class SystemManagerGuard implements CanActivate {
  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  canActivate() {
    this.router.navigate;
    return this.http
      .get<{ roles: string[] }>(GET_USER_PROFILE_ROLES, {
        headers: {
          [AUTHORIZATION]:
            BEARER_TOKEN_PREFIX + localStorage.getItem(ACCESS_TOKEN),
        },
      })
      .pipe(
        switchMap(res => {
          if (
            res &&
            res.roles.length > 0 &&
            res.roles.includes(SYSTEM_MANAGER)
          ) {
            return of(true);
          }
          return of(false);
        }),
      );
  }
}
