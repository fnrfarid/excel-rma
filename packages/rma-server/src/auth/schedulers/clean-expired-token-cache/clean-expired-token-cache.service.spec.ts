import { Test, TestingModule } from '@nestjs/testing';
import { CleanExpiredTokenCacheService } from './clean-expired-token-cache.service';
import { TokenCacheService } from '../../entities/token-cache/token-cache.service';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

describe('CleanExpiredTokenCacheService', () => {
  let service: CleanExpiredTokenCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanExpiredTokenCacheService,
        { provide: TokenCacheService, useValue: {} },
        { provide: ServerSettingsService, useValue: {} },
        { provide: AGENDA_TOKEN, useValue: {} },
      ],
    }).compile();

    service = module.get<CleanExpiredTokenCacheService>(
      CleanExpiredTokenCacheService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
