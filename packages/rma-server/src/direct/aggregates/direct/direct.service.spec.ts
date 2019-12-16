import { Test, TestingModule } from '@nestjs/testing';
import { DirectService } from './direct.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { RequestStateService } from '../../entities/request-state/request-state.service';
import { FrappeTokenService } from '../../entities/frappe-token/frappe-token.service';
import { HttpModule } from '@nestjs/common';

describe('DirectService', () => {
  let service: DirectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        DirectService,
        {
          provide: RequestStateService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: FrappeTokenService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DirectService>(DirectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
