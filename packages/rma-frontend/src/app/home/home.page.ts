import { Component, OnInit } from '@angular/core';
import {
  ACCESS_TOKEN,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  LOGGED_IN,
} from '../constants/storage';
import { HttpClient } from '@angular/common/http';
import { DIRECT_PROFILE_ENDPOINT } from '../constants/url-strings';
import { IDTokenClaims } from '../common/interfaces/id-token-claims.interfaces';
import { LoginService } from '../api/login/login.service';
import { StorageService } from '../api/storage/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  loggedIn: boolean;
  picture: string;
  state: string;
  accessToken: string;
  email: string;
  fullName: string;

  constructor(
    private readonly http: HttpClient,
    private readonly login: LoginService,
    private readonly storage: StorageService,
  ) {}

  ngOnInit() {
    this.loggedIn = this.storage.getItem(ACCESS_TOKEN) ? true : false;
    this.storage.getItem(ACCESS_TOKEN).then(token => {
      this.loggedIn = token ? true : false;
      this.accessToken = token as string;
      this.loadProfile();
    });

    this.setUserSession();
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
    const headers = {
      [AUTHORIZATION]: BEARER_TOKEN_PREFIX + this.accessToken,
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
}
