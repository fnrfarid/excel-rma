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
  LOGGED_IN,
} from './constants/storage';
import { AppService } from './app.service';
import { LoginService } from './api/login/login.service';
import { SYSTEM_MANAGER, PURCHASE_USER } from './constants/app-string';
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
  isSettingMenuVisible: boolean = false;
  isSalesMenuVisible: boolean = false;
  fullName: string = '';
  imageURL: string = '';
  showPurchase: boolean = false;
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
        .then(saved => this.loginService.login());
    }
  }

  ngOnInit() {
    this.setUserSession();
    this.setupSilentRefresh();
    this.appService.getGlobalDefault();
  }

  setUserSession() {
    this.loginService.changes.subscribe({
      next: event => {
        if (event.key === LOGGED_IN && event.value === true) {
          this.loggedIn = true;
        } else {
          this.loggedIn = false;
        }
      },
      error: error => {},
    });

    if (location.hash.includes(ACCESS_TOKEN)) {
      const hash = (location.hash as string).replace('#', '');
      const query = new URLSearchParams(hash);
      const token = query.get(ACCESS_TOKEN);
      this.checkRoles(token);
      this.loadProfile(token);
    } else {
      this.appService
        .getStorage()
        .getItem(ACCESS_TOKEN)
        .then(token => {
          this.checkRoles(token);
          this.loadProfile(token);
        });
    }
  }

  loadProfile(token: string) {
    this.appService.loadProfile(token).subscribe({
      error: error => {
        this.loggedIn = false;
        this.appService.setupImplicitFlow();
      },
      next: profile => {
        this.loggedIn = true;
        this.fullName = profile.name;
        this.imageURL = profile.picture;
      },
    });
  }

  checkRoles(token: string) {
    this.settingService.checkUserProfile(token).subscribe({
      next: res => {
        this.loggedIn = true;
        if (
          res &&
          res.roles &&
          res.roles.length > 0 &&
          res.roles.includes(SYSTEM_MANAGER)
        ) {
          this.showSettings = true;
        }

        if (
          res &&
          res.roles &&
          res.roles.length > 0 &&
          res.roles.includes(PURCHASE_USER)
        ) {
          this.showPurchase = true;
        }
      },
      error: error => {
        this.showSettings = false;
        this.showPurchase = false;
      },
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
