import { Component, OnInit, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
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
import { interval, Subscription } from 'rxjs';
import { LoginService } from './api/login/login.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  loggedIn: boolean;
  hideAuthButtons: boolean = false;
  subscription: Subscription;

  constructor(
    private readonly platform: Platform,
    private readonly splashScreen: SplashScreen,
    private readonly statusBar: StatusBar,
    private readonly appService: AppService,
    private readonly loginService: LoginService,
  ) {
    this.initializeApp();
  }

  @HostListener('window:message', ['$event'])
  onMessage(event) {
    if (event && event.data && typeof event.data === 'string') {
      const hash = event.data.replace('#', '');
      const query = new URLSearchParams(hash);
      localStorage.setItem(ACCESS_TOKEN, query.get(ACCESS_TOKEN));
      const now = Math.floor(Date.now() / 1000);
      localStorage.setItem(
        ACCESS_TOKEN_EXPIRY,
        (now + Number(query.get(EXPIRES_IN))).toString(),
      );
    }
  }

  ngOnInit() {
    this.setupSilentRefresh();
    const localToken = localStorage.getItem(ACCESS_TOKEN);
    if (localToken) {
      this.silentRefresh();
    }
  }

  setUserSession() {
    if (localStorage.getItem(ACCESS_TOKEN) || location.hash) {
      this.loggedIn = true;
    } else {
      this.loggedIn = false;
      this.setupImplicitFlow();
    }
  }

  setupSilentRefresh() {
    const source = interval(TEN_MINUTES_IN_MS);
    this.subscription = source.subscribe(val => this.silentRefresh());
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent();
      this.splashScreen.hide();
    });
    this.setUserSession();
  }

  login() {
    this.setupImplicitFlow();
  }

  logout() {
    this.loggedIn = false;
    localStorage.clear();
    this.loginService.logout();
  }

  setupImplicitFlow(): void {
    this.appService.getMessage().subscribe({
      next: response => {
        if (
          !response ||
          (response &&
            !response.frontendClientId &&
            !response.appURL &&
            !response.authorizationURL)
        ) {
          return;
        }

        this.appService.setInfoLocalStorage(response);
        const frappe_auth_config = {
          client_id: response.frontendClientId,
          redirect_uri: response.appURL + CALLBACK_ENDPOINT,
          response_type: TOKEN,
          scope: SCOPES_OPENID_ALL,
        };
        this.initiateLogin(response.authorizationURL, frappe_auth_config);
        return;
      },
      error: error => {},
    });
  }

  initiateLogin(authorizationUrl: string, frappe_auth_config) {
    window.location.href = this.getEncodedFrappeLoginUrl(
      authorizationUrl,
      frappe_auth_config,
    );
    return;
  }

  getEncodedFrappeLoginUrl(authorizationUrl, frappe_auth_config) {
    const state = this.appService.generateRandomString(32);
    localStorage.setItem(STATE, state);
    authorizationUrl += `?client_id=${frappe_auth_config.client_id}`;
    authorizationUrl += `&scope=${encodeURIComponent(
      frappe_auth_config.scope,
    )}`;
    authorizationUrl += `&redirect_uri=${encodeURIComponent(
      frappe_auth_config.redirect_uri,
    )}`;
    authorizationUrl += `&response_type=${frappe_auth_config.response_type}`;
    authorizationUrl += `&state=${state}`;
    return authorizationUrl;
  }

  silentRefresh() {
    const now = Math.floor(Date.now() / 1000);
    const expiry = localStorage.getItem(ACCESS_TOKEN_EXPIRY)
      ? Number(localStorage.getItem(ACCESS_TOKEN_EXPIRY))
      : now;
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
          const url = this.getEncodedFrappeLoginUrl(
            response.authorizationURL,
            frappe_auth_config,
          );

          const existingIframe = document.getElementsByClassName(
            'silent-iframe',
          );

          if (!existingIframe.length) {
            const iframe = document.createElement('iframe');
            iframe.onload = () => {
              try {
                (iframe.contentWindow || iframe.contentDocument).location.href;
              } catch (err) {
                localStorage.clear();
                this.initiateLogin(response.authorizationURL, {
                  ...frappe_auth_config,
                  ...{ redirect_uri: response.appURL + CALLBACK_ENDPOINT },
                });
              }
            };
            iframe.className = 'silent-iframe';
            iframe.setAttribute('src', url);

            iframe.style.display = 'none';
            document.body.appendChild(iframe);
          } else {
            existingIframe[0].setAttribute('src', url);
          }
        },
        error: error => {},
      });
    }
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
