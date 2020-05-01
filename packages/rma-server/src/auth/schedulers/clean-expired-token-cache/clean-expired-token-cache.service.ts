import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';

import { TokenCacheService } from '../../entities/token-cache/token-cache.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

export const CLEAN_EXPIRED_TOKEN_QUEUE = 'CLEAN_EXPIRED_TOKEN_QUEUE';

@Injectable()
export class CleanExpiredTokenCacheService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly tokenCache: TokenCacheService,
  ) {}
  onModuleInit() {
    this.agenda.define(
      CLEAN_EXPIRED_TOKEN_QUEUE,
      { concurrency: 1 },
      async job => {
        const query: { [key: string]: any } = {
          exp: { $lte: Math.floor(new Date().valueOf() / 1000) },
        };

        await this.tokenCache.deleteMany({
          ...query,
          ...{
            $or: [{ refreshToken: null }, { refreshToken: { $exists: false } }],
          },
        });
      },
    );

    this.agenda
      .every('15 minutes', CLEAN_EXPIRED_TOKEN_QUEUE)
      .then(scheduled => {})
      .catch(error => {});
  }
}
