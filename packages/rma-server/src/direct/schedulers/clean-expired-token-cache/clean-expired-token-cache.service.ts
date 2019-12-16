import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { TokenCacheService } from '../../../auth/entities/token-cache/token-cache.service';

export const TOKEN_CLEANUP_CRON_STRING = '0 */15 * * * *';

@Injectable()
export class CleanExpiredTokenCacheService implements OnModuleInit {
  constructor(private readonly tokenCache: TokenCacheService) {}
  onModuleInit() {
    const job = new CronJob(TOKEN_CLEANUP_CRON_STRING, async () => {
      await this.tokenCache.deleteMany({
        exp: { $lte: Math.floor(new Date().valueOf() / 1000) },
      });
    });
    job.start();
  }
}
