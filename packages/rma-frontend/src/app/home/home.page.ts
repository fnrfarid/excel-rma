import { Component, OnInit } from '@angular/core';
import {
  ACCESS_TOKEN,
  ACCESS_TOKEN_EXPIRY,
  AUTHORIZATION,
  BEARER_TOKEN_PREFIX,
  LOGGED_IN,
} from '../constants/storage';
import { HttpClient } from '@angular/common/http';
import { DIRECT_PROFILE_ENDPOINT } from '../constants/url-strings';
import { IDTokenClaims } from '../common/interfaces/id-token-claims.interfaces';
import { LoginService } from '../api/login/login.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  loggedIn: boolean;
  picture: string;
  expires: string;
  state: string;
  accessToken: string;
  email: string;
  fullName: string;

  constructor(
    private readonly http: HttpClient,
    private readonly login: LoginService,
  ) {
    this.loggedIn = localStorage.getItem(ACCESS_TOKEN) ? true : false;
  }

  ngOnInit() {
    this.setUserSession();
    this.loadProfile();
  }

  setUserSession() {
    this.accessToken = localStorage.getItem(ACCESS_TOKEN);
    this.expires = localStorage.getItem(ACCESS_TOKEN_EXPIRY);
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
