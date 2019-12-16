import { Test, TestingModule } from '@nestjs/testing';
import { ConnectService } from './connect.service';
import { TokenCacheService } from '../../entities/token-cache/token-cache.service';
import { ClientTokenManagerService } from '../client-token-manager/client-token-manager.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { HttpService } from '@nestjs/common';

describe('ConnectService', () => {
  let service: ConnectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectService,
        {
          provide: TokenCacheService,
          useValue: {},
        },
        {
          provide: ClientTokenManagerService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ConnectService>(ConnectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
