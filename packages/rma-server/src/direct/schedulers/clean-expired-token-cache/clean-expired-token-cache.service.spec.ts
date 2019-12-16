import { Test, TestingModule } from '@nestjs/testing';
import { CleanExpiredTokenCacheService } from './clean-expired-token-cache.service';
import { TokenCacheService } from '../../../auth/entities/token-cache/token-cache.service';

describe('CleanExpiredTokenCacheService', () => {
  let service: CleanExpiredTokenCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanExpiredTokenCacheService,
        { provide: TokenCacheService, useValue: {} },
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
