import { TestBed } from '@angular/core/testing';

import { AddWarrantyService } from './add-warranty.service';
import { STORAGE_TOKEN } from '../../api/storage/storage.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AddWarrantyService', () => {
  let service: AddWarrantyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: STORAGE_TOKEN, useValue: {} }],
    });
    service = TestBed.inject(AddWarrantyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
