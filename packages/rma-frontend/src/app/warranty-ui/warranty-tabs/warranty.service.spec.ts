import { TestBed } from '@angular/core/testing';

import { WarrantyService } from './warranty.service';
import { HttpErrorHandler } from '../../common/interfaces/services/http-error-handler/http-error-handler.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('WarrantyService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HttpErrorHandler,
          useValue: {
            handleError<T>(...args) {},
            createHandleError(...args) {},
          },
        },
      ],
    }),
  );

  it('should be created', () => {
    const service: WarrantyService = TestBed.get(WarrantyService);
    expect(service).toBeTruthy();
  });
});
