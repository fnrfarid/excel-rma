import { Component, OnInit, HostListener } from '@angular/core';
import { interval, Subscription, of, throwError } from 'rxjs';
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
  AUTH_SERVER_URL,
} from './constants/storage';
import { AppService } from './app.service';
import { LoginService } from './api/login/login.service';
import { SYSTEM_MANAGER, PURCHASE_USER } from './constants/app-string';
import { SettingsService } from './settings/settings.service';
import { switchMap, retry, delay } from 'rxjs/operators';

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
  isRnDMenuVisible: boolean = false;
  newDNUrl: string = '';
  listRnDURL: string = '';
  binListURL: string = '';
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
          this.checkRolesAndLoadProfileWithToken();
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
      this.checkRolesAndLoadProfileWithToken();
    }
  }

  checkRolesAndLoadProfileWithToken() {
    this.appService
      .getStorage()
      .getItem(ACCESS_TOKEN)
      .then(token => {
        this.checkRoles(token);
        this.loadProfile(token);
      });
  }

  loadProfile(token: string) {
    this.getRnDUrls();
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
    this.settingService
      .checkUserProfile(token)
      .pipe(
        switchMap((data: { roles?: string[] }) => {
          if (data && data.roles && data.roles.length === 0) {
            return of({}).pipe(
              delay(1000),
              switchMap(obj => {
                return throwError(data);
              }),
            );
          }
          return of(data);
        }),
        retry(3),
      )
      .subscribe({
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

  getRnDUrls() {
    this.appService
      .getStorage()
      .getItem(AUTH_SERVER_URL)
      .then(auth_url => {
        this.newDNUrl = `${auth_url}/desk#Form/Delivery Note/New Delivery Note 1`;
        this.listRnDURL = `${auth_url}/desk#List/Delivery Note/List?against_sales_invoice=["is","not set"]`;
        this.binListURL = `${auth_url}/desk#List/Bin/List`;
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
