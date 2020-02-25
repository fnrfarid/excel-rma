import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { TokenCacheService } from '../../entities/token-cache/token-cache.service';

export const TOKEN_CLEANUP_CRON_STRING = '0 */15 * * * *';

@Injectable()
export class CleanExpiredTokenCacheService implements OnModuleInit {
  constructor(private readonly tokenCache: TokenCacheService) {}
  onModuleInit() {
    const job = new CronJob(TOKEN_CLEANUP_CRON_STRING, async () => {
      const query: { [key: string]: any } = {
        exp: { $lte: Math.floor(new Date().valueOf() / 1000) },
      };

      await this.tokenCache.deleteMany({
        ...query,
        ...{
          $or: [{ refreshToken: null }, { refreshToken: { $exists: false } }],
        },
      });
    });

    job.start();
  }
}
