import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserTab } from '@ionic-native/browser-tab/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

import { StorageService } from './storage.service';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const iabSpy = jasmine.createSpyObj('InAppBrowser', ['create']);
  const browserTabSpy = jasmine.createSpyObj('BrowserTab', [
    'isAvailable',
    'openUrl',
  ]);

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StorageService,
        { provide: InAppBrowser, useValue: iabSpy },
        { provide: BrowserTab, useValue: browserTabSpy },
      ],
    }),
  );

  it('should be created', () => {
    const service: TokenService = TestBed.get(TokenService);
    expect(service).toBeTruthy();
  });
});
