import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';

import { Platform, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Subscription, of } from 'rxjs';
import { AppService } from './app.service';

describe('AppComponent', () => {
  let statusBarSpy, splashScreenSpy, navSpy;

  beforeEach(async(() => {
    statusBarSpy = jasmine.createSpyObj('StatusBar', ['styleLightContent']);
    splashScreenSpy = jasmine.createSpyObj('SplashScreen', ['hide']);
    navSpy = jasmine.createSpyObj('NavController', ['navigateBack']);

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: StatusBar, useValue: statusBarSpy },
        { provide: SplashScreen, useValue: splashScreenSpy },
        { provide: NavController, useValue: navSpy },
        {
          provide: AppService,
          useValue: {
            getMessage: (...args) => of({}),
            setInfoLocalStorage: (...args) => null,
          },
        },
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
      imports: [RouterTestingModule.withRoutes([]), HttpClientTestingModule],
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
});
