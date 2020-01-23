import { TestBed } from '@angular/core/testing';

import { MapTerritoryService } from './map-territory.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MapTerritoryService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }),
  );

  it('should be created', () => {
    const service: MapTerritoryService = TestBed.get(MapTerritoryService);
    expect(service).toBeTruthy();
  });
});
