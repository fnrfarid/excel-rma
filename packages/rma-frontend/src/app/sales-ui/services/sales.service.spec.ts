import { TestBed } from '@angular/core/testing';

import { SalesService } from './sales.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SalesService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }),
  );

  it('should be created', () => {
    const service: SalesService = TestBed.get(SalesService);
    expect(service).toBeTruthy();
  });
});
