import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import {
  HttpBackend,
  HttpXhrBackend,
  HttpClientModule,
} from '@angular/common/http';

import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import {
  NativeHttpModule,
  NativeHttpBackend,
  NativeHttpFallback,
} from 'ionic-native-http-connection-backend';
import { BrowserTab } from '@ionic-native/browser-tab/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TokenService } from './api/token.service';
import { StorageService } from './api/storage.service';
import { CallbackComponent } from './callback/callback.component';

@NgModule({
  declarations: [AppComponent, CallbackComponent],
  entryComponents: [],
  imports: [
    HttpClientModule,
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    NativeHttpModule,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    TokenService,
    InAppBrowser,
    StorageService,
    {
      provide: HttpBackend,
      useClass: NativeHttpFallback,
      deps: [Platform, NativeHttpBackend, HttpXhrBackend],
    },
    BrowserTab,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
