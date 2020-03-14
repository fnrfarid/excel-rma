import { Test, TestingModule } from '@nestjs/testing';
import { ItemSyncService } from './item-sync.service';
import { SyncAggregateService } from '../../../sync/aggregates/sync-aggregate/sync-aggregate.service';
import { ItemService } from '../../../item/entity/item/item.service';
import { RequestStateService } from '../../../direct/entities/request-state/request-state.service';

describe('ItemSyncService', () => {
  let service: ItemSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemSyncService,
        { provide: SyncAggregateService, useValue: {} },
        { provide: ItemService, useValue: {} },
        { provide: RequestStateService, useValue: {} },
      ],
    }).compile();

    service = module.get<ItemSyncService>(ItemSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
