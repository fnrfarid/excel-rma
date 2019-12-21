import { Test, TestingModule } from '@nestjs/testing';
import { ItemWebhookAggregateService } from './item-webhook-aggregate.service';

describe('ItemWebhookAggregateService', () => {
  let service: ItemWebhookAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemWebhookAggregateService],
    }).compile();

    service = module.get<ItemWebhookAggregateService>(
      ItemWebhookAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
