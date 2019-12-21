import { Test, TestingModule } from '@nestjs/testing';
import { ItemWebhookController } from './Item-webhook.controller';
import { ItemWebhookAggregateService } from '../../aggregates/item-webhook-aggregate/item-webhook-aggregate.service';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';

describe('ItemWebhook Controller', () => {
  let controller: ItemWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemWebhookController],
      providers: [
        {
          provide: ItemWebhookAggregateService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(FrappeWebhookGuard)
      .useValue({})
      .compile();

    controller = module.get<ItemWebhookController>(ItemWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
