import { Component, NgZone, OnInit } from '@angular/core';
import { Platform, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';

import { TokenService } from './api/token.service';
import { OAuthProviderClientCredentials } from './api/constants/frappe-oauth2config';
import { LOGGED_IN } from './api/constants/storage';
import { APP_KEY } from './api/constants/strings';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  loggedIn: boolean;
  isApp: boolean;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private token: TokenService,
    private ngZone: NgZone,
    private router: Router,
    public nav: NavController,
  ) {
    this.initializeApp();
    this.backButtonEventListener();
  }

  initializeApp() {
    this.catchUrlScheme();
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent();
      this.splashScreen.hide();
    });
  }

  ngOnInit() {
    this.loggedIn = localStorage.getItem(LOGGED_IN) ? true : false;
    this.token.setupOauthConfig(OAuthProviderClientCredentials);
  }

  login() {
    this.token.initializeCodeGrant();
  }

  logout() {
    this.token.logout();
    this.loggedIn = false;
  }

  catchUrlScheme() {
    // https://github.com/EddyVerbruggen/Custom-URL-scheme/issues/227
    (window as any).handleOpenURL = (url: string) => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.handleOpenUrl(url);
        });
      }, 0);
    };
  }

  handleOpenUrl(url: string) {
    this.token.processCode(url);
  }

  backButtonEventListener() {
    this.platform.backButton.subscribeWithPriority(0, () => {
      this.navigateToPreviousPage();
    });
  }

  navigateToPreviousPage() {
    // https://link.medium.com/Zy0YtQDTSY
    const url = this.router.url;
    if (url === '/home' && this.platform.is('cordova')) {
      navigator[APP_KEY].exitApp();
    } else {
      this.nav.navigateBack(
        url.replace(new RegExp('(/([a-zA-Z0-9-.])*)$'), ''),
      );
    }
  }
}
