import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as Agenda from 'agenda';
import { TokenCacheService } from '../../../auth/entities/token-cache/token-cache.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

export const CLEAN_TOKEN_CACHE = 'CLEAN_TOKEN_CACHE';

@Injectable()
export class CleanExpiredTokenCacheService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly tokenCache: TokenCacheService,
  ) {}
  onModuleInit() {
    this.agenda.define(CLEAN_TOKEN_CACHE, async job => {
      await this.tokenCache.deleteMany({
        exp: { $lte: Math.floor(new Date().valueOf() / 1000) },
      });
    });

    this.agenda
      .every('15 minutes', CLEAN_TOKEN_CACHE)
      .then(scheduled => {})
      .catch(error => {});
  }
}
