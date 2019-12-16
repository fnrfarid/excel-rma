import { Component, OnInit } from '@angular/core';
import { LOGGED_IN, ACCESS_TOKEN } from '../api/constants/storage';
import { StorageService } from '../api/storage.service';
import { TokenService } from '../api/token.service';
import { switchMap } from 'rxjs/operators';
import { OAuthProviderClientCredentials } from '../api/constants/frappe-oauth2config';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  loggedIn: boolean = false;
  accessToken: string;
  picture: string;
  email: string;
  name: string;

  constructor(
    private store: StorageService,
    private token: TokenService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.store.changes.subscribe({
      next: event => {
        if (event.key === LOGGED_IN) {
          this.loggedIn = event.value ? true : false;
        }
        if (event.key === ACCESS_TOKEN) {
          this.accessToken = event.value;
        }
      },
      error: error => {},
    });
    this.loggedIn = localStorage.getItem(LOGGED_IN) ? true : false;
    this.accessToken = localStorage.getItem(ACCESS_TOKEN);

    this.token
      .getToken()
      .pipe(
        switchMap(token => {
          return this.http.get<any>(
            OAuthProviderClientCredentials.authServerUrl +
              '/api/method/frappe.integrations.oauth2.openid_profile',
            { headers: { authorization: 'Bearer ' + token } },
          );
        }),
      )
      .subscribe({
        next: profile => {
          this.name = profile.name;
          this.email = profile.email;
          this.picture = profile.picture;
        },
        error: error => {},
      });
  }
}
