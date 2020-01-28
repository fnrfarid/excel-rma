import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  LOGGED_IN,
  AUTH_SERVER_URL,
} from '../constants/storage';
import { DIRECT_PROFILE_ENDPOINT } from '../constants/url-strings';
import { IDTokenClaims } from '../common/interfaces/id-token-claims.interfaces';
import { LoginService } from '../api/login/login.service';
import { StorageService } from '../api/storage/storage.service';
import { AppService } from '../app.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  loggedIn: boolean;
  picture: string;
  state: string;
  email: string;
  fullName: string;

  constructor(
    private readonly http: HttpClient,
    private readonly login: LoginService,
    private readonly storage: StorageService,
    private readonly router: Router,
    private readonly appService: AppService,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => {
          this.loadProfile();
          return event;
        }),
      )
      .subscribe({
        next: res => {
          this.storage.getItem(AUTH_SERVER_URL).then(url => {
            if (!url) {
              this.appService.getMessage().subscribe({
                next: success => this.appService.setInfoLocalStorage(success),
                error: error => {},
              });
            }
          });
        },
        error: err => {},
      });
    this.setUserSession();
    this.loadProfile();
  }

  setUserSession() {
    this.login.changes.subscribe({
      next: event => {
        if (event.key === LOGGED_IN && event.value === false) {
          this.loggedIn = false;
        }
      },
      error: error => {},
    });
  }

  loadProfile() {
    this.storage.getItem(ACCESS_TOKEN).then(token => {
      this.loggedIn = token ? true : false;
      if (this.loggedIn) {
        const headers = {
          [AUTHORIZATION]: BEARER_TOKEN_PREFIX + token,
        };

        this.http
          .get<IDTokenClaims>(DIRECT_PROFILE_ENDPOINT, {
            headers,
          })
          .subscribe({
            error: error => {},
            next: profile => {
              this.email = profile.email;
              this.fullName = profile.name;
            },
          });
      }
    });
  }
}
