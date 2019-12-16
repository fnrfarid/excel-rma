import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { stringify } from 'querystring';
import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  APP_URL,
  CLIENT_ID,
  SCOPE,
  TOKEN_URL,
  REDIRECT_PREFIX,
  STATE,
  LOGGED_IN,
  ONE_HOUR_IN_SECONDS_STRING,
  EXPIRES_IN,
} from '../api/constants/storage';
import { StorageService } from '../api/storage.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
})
export class CallbackComponent implements OnInit {
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly store: StorageService,
  ) {}

  ngOnInit() {
    const queryParams = this.activatedRoute.snapshot.queryParams;
    if (!queryParams.state || !queryParams.code) {
      this.failure();
    }
    this.store.clear(STATE);
    this.getRefreshToken(queryParams.code);
  }

  getRefreshToken(code) {
    const req: any = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: APP_URL + REDIRECT_PREFIX,
      client_id: localStorage.getItem(CLIENT_ID),
      scope: localStorage.getItem(SCOPE),
    };
    this.http
      .post<any>(localStorage.getItem(TOKEN_URL), stringify(req), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .subscribe({
        next: response => {
          const expiresIn = response.expires_in || ONE_HOUR_IN_SECONDS_STRING;
          const expirationTime = new Date();
          expirationTime.setSeconds(
            expirationTime.getSeconds() + Number(expiresIn),
          );

          this.store.store(ACCESS_TOKEN, response.access_token);
          this.store.store(REFRESH_TOKEN, response.refresh_token);
          this.store.store(EXPIRES_IN, expirationTime.toISOString());
          this.store.store(LOGGED_IN, 'true');
          this.router.navigateByUrl('/home');
        },
        error: err => this.failure(),
      });
  }

  failure() {
    this.router.navigateByUrl('/home');
    return;
  }
}
