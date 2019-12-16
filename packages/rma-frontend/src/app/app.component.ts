import { Component, OnInit, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import {
  TOKEN,
  SCOPE,
  ACCESS_TOKEN,
  STATE,
  CALLBACK_ENDPOINT,
  SILENT_REFRESH_ENDPOINT,
  ACCESS_TOKEN_EXPIRY,
  EXPIRES_IN,
  TEN_MINUTES_IN_MS,
} from './constants/storage';
import { AppService } from './app.service';
import { interval, Subscription } from 'rxjs';

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
  }

  setupImplicitFlow(): void {
    this.appService.getMessage().subscribe(response => {
      if (response.message || !response.frontendCallbackURLs) return; // { message: PLEASE_RUN_SETUP }
      this.appService.setInfoLocalStorage(response);
      const frappe_auth_config = {
        client_id: response.frontendClientId,
        redirect_uri: response.appURL + CALLBACK_ENDPOINT,
        response_type: TOKEN,
        scope: SCOPE,
      };
      this.initiateLogin(response.authorizationURL, frappe_auth_config);
      return;
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
    const now = Date.now() / 1000;
    const expiry = localStorage.getItem(ACCESS_TOKEN_EXPIRY)
      ? Number(localStorage.getItem(ACCESS_TOKEN_EXPIRY))
      : now;
    if (now > expiry - TEN_MINUTES_IN_MS) {
      this.appService.getMessage().subscribe(response => {
        if (response.message) return;
        const frappe_auth_config = {
          client_id: response.frontendClientId,
          redirect_uri: response.appURL + SILENT_REFRESH_ENDPOINT,
          response_type: TOKEN,
          scope: SCOPE,
        };
        const url = this.getEncodedFrappeLoginUrl(
          response.authorizationURL,
          frappe_auth_config,
        );
        const existingIframe = document.getElementsByClassName('silent');
        if (!existingIframe.length) {
          const iframe = document.createElement('iframe');
          iframe.className = 'silent';
          iframe.setAttribute('src', url);

          iframe.style.display = 'none';

          return document.body.appendChild(iframe);
        }
        return existingIframe[0].setAttribute('src', url);
      });
    }
  }

  ngOnDestroy() {
    this.subscription && this.subscription.unsubscribe();
  }
}
