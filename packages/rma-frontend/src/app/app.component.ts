import { Component, OnInit, HostListener } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import {
  TOKEN,
  ACCESS_TOKEN,
  STATE,
  CALLBACK_ENDPOINT,
  SILENT_REFRESH_ENDPOINT,
  ACCESS_TOKEN_EXPIRY,
  EXPIRES_IN,
  TEN_MINUTES_IN_MS,
  SCOPES_OPENID_ALL,
  TWENTY_MINUTES_IN_SECONDS,
} from './constants/storage';
import { AppService } from './app.service';
import { LoginService } from './api/login/login.service';
import { SYSTEM_MANAGER } from './constants/app-string';
import { SettingsService } from './settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  loggedIn: boolean = false;
  hideAuthButtons: boolean = false;
  subscription: Subscription;
  showSettings: boolean = false;

  constructor(
    private readonly appService: AppService,
    private readonly loginService: LoginService,
    private readonly settingService: SettingsService,
  ) {}

  @HostListener('window:message', ['$event'])
  onMessage(event) {
    if (event && event.data && typeof event.data === 'string') {
      const hash = event.data.replace('#', '');
      const query = new URLSearchParams(hash);
      const now = Math.floor(Date.now() / 1000);
      this.appService
        .getStorage()
        .setItem(ACCESS_TOKEN, query.get(ACCESS_TOKEN))
        .then(token => this.checkRoles(token))
        .then(() => {
          return this.appService
            .getStorage()
            .setItem(
              ACCESS_TOKEN_EXPIRY,
              (now + Number(query.get(EXPIRES_IN))).toString(),
            );
        })
        .then(saved => {});
    }
  }

  ngOnInit() {
    this.setUserSession();
    this.setupSilentRefresh();
    this.appService
      .getStorage()
      .getItem(ACCESS_TOKEN)
      .then(localToken => {
        if (localToken) {
          this.silentRefresh();
          this.checkRoles(localToken as string);
        }
      });
    this.appService.getGlobalDefault();
  }

  setUserSession() {
    this.appService
      .getStorage()
      .getItem(ACCESS_TOKEN)
      .then(token => {
        if (token || location.hash.includes('access_token')) {
          const hash = (location.hash as string).replace('#', '');
          const query = new URLSearchParams(hash);
          this.loggedIn = true;
          if (!token) {
            this.checkRoles(query.get(ACCESS_TOKEN));
          } else {
            this.checkRoles(token);
          }
        } else {
          this.loggedIn = false;
        }
      });
  }

  checkRoles(token: string) {
    this.settingService.checkUserProfile(token).subscribe({
      next: res => {
        if (
          res &&
          res.roles &&
          res.roles.length > 0 &&
          res.roles.includes(SYSTEM_MANAGER)
        ) {
          this.showSettings = true;
        }
      },
      error: error => (this.showSettings = false),
    });
  }

  setupSilentRefresh() {
    const source = interval(TEN_MINUTES_IN_MS);
    this.subscription = source.subscribe(val => this.silentRefresh());
  }

  login() {
    this.appService.setupImplicitFlow();
  }

  logout() {
    this.loggedIn = false;
    this.appService
      .getStorage()
      .clear()
      .then(() => this.loginService.logout());
  }

  silentRefresh() {
    const now = Math.floor(Date.now() / 1000);
    this.appService
      .getStorage()
      .getItem(ACCESS_TOKEN_EXPIRY)
      .then(tokenExpiry => {
        const expiry = tokenExpiry ? Number(tokenExpiry) : now;
        if (now > expiry - TWENTY_MINUTES_IN_SECONDS) {
          this.appService.getMessage().subscribe({
            next: response => {
              if (!response) return;
              const frappe_auth_config = {
                client_id: response.frontendClientId,
                redirect_uri: response.appURL + SILENT_REFRESH_ENDPOINT,
                response_type: TOKEN,
                scope: SCOPES_OPENID_ALL,
              };

              const state = this.appService.generateRandomString(32);
              this.appService
                .getStorage()
                .setItem(STATE, state)
                .then(savedState => {
                  const url = this.appService.getEncodedFrappeLoginUrl(
                    response.authorizationURL,
                    frappe_auth_config,
                    savedState,
                  );

                  const existingIframe = document.getElementsByClassName(
                    'silent-iframe',
                  );

                  if (!existingIframe.length) {
                    const iframe = document.createElement('iframe');
                    iframe.onload = () => {
                      try {
                        (iframe.contentWindow || iframe.contentDocument)
                          .location.href;
                      } catch (err) {
                        this.appService
                          .getStorage()
                          .clear()
                          .then(() =>
                            this.appService.initiateLogin(
                              response.authorizationURL,
                              {
                                ...frappe_auth_config,
                                ...{
                                  redirect_uri:
                                    response.appURL + CALLBACK_ENDPOINT,
                                },
                              },
                            ),
                          );
                      }
                    };
                    iframe.className = 'silent-iframe';
                    iframe.setAttribute('src', url);

                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                  } else {
                    existingIframe[0].setAttribute('src', url);
                  }
                });
            },
            error: error => {},
          });
        }
      });
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
