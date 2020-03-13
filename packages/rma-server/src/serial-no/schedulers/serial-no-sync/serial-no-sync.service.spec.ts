import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoSyncService } from './serial-no-sync.service';
import { SyncAggregateService } from '../../../sync/aggregates/sync-aggregate/sync-aggregate.service';
import { RequestStateService } from '../../../direct/entities/request-state/request-state.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';

describe('SerialNoSyncService', () => {
  let service: SerialNoSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialNoSyncService,
        { provide: SyncAggregateService, useValue: {} },
        { provide: SerialNoService, useValue: {} },
        { provide: RequestStateService, useValue: {} },
      ],
    }).compile();

    service = module.get<SerialNoSyncService>(SerialNoSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
