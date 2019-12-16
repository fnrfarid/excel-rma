import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { Platform, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { RouterTestingModule } from '@angular/router/testing';
import { Subscription } from 'rxjs';

import { TokenService } from './api/token.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let statusBarSpy, splashScreenSpy, inAppBrowserSpy, tokenServiceSpy, navSpy;

  beforeEach(async(() => {
    statusBarSpy = jasmine.createSpyObj('StatusBar', ['styleLightContent']);
    splashScreenSpy = jasmine.createSpyObj('SplashScreen', ['hide']);
    inAppBrowserSpy = jasmine.createSpyObj('InAppBrowser', ['create']);
    navSpy = jasmine.createSpyObj('NavController', ['navigateBack']);
    tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'configure',
      'login',
      'logout',
      'processCode',
      'setupOauthConfig',
    ]);

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: StatusBar, useValue: statusBarSpy },
        { provide: SplashScreen, useValue: splashScreenSpy },
        { provide: InAppBrowser, useValue: inAppBrowserSpy },
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: NavController, useValue: navSpy },
        {
          provide: Platform,
          useValue: {
            ready: () => Promise.resolve(),
            backButton: {
              subscribeWithPriority: (...args) => new Subscription(),
            },
          },
        },
      ],
      imports: [RouterTestingModule.withRoutes([])],
    }).compileComponents();
  }));

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize the app', async () => {
    const platform = jasmine.createSpyObj('Platform', {
      ready: Promise.resolve,
    });
    TestBed.createComponent(AppComponent);
    await platform.ready();
    expect(statusBarSpy.styleLightContent).toHaveBeenCalled();
    expect(splashScreenSpy.hide).toHaveBeenCalled();
  });

  it('should have menu labels', async () => {
    const fixture = await TestBed.createComponent(AppComponent);
    await fixture.detectChanges();
    const app = fixture.nativeElement;
    const menuItems = app.querySelectorAll('ion-label');
    expect(menuItems.length).toEqual(1);
    expect(menuItems[0].textContent).toContain('Login');
  });

  it('should have urls', async () => {
    const fixture = await TestBed.createComponent(AppComponent);
    await fixture.detectChanges();
    const app = fixture.nativeElement;
    const menuItems = app.querySelectorAll('ion-item');
    expect(menuItems.length).toEqual(1);
    expect(menuItems[0].getAttribute('ng-reflect-router-link')).toEqual('/');
  });
});
