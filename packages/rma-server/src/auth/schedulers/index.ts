import { CleanExpiredTokenCacheService } from './clean-expired-token-cache/clean-expired-token-cache.service';
import { RevokeExpiredFrappeTokensService } from './revoke-expired-frappe-tokens/revoke-expired-frappe-tokens.service';

export const AuthSchedulers = [
  CleanExpiredTokenCacheService,
  RevokeExpiredFrappeTokensService,
];
