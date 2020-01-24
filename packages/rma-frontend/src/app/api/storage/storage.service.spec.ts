import { TestBed } from '@angular/core/testing';

import { StorageService, STORAGE_TOKEN } from './storage.service';

describe('StorageService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_TOKEN, useValue: {} }],
    }),
  );

  it('should be created', () => {
    const service: StorageService = TestBed.get(StorageService);
    expect(service).toBeTruthy();
  });
});
