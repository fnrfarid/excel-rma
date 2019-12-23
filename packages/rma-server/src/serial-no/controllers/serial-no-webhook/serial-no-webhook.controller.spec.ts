import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoWebhookController } from './serial-no-webhook.controller';
import { SerialNoWebhookAggregateService } from '../../aggregates/serial-no-webhook-aggregate/serial-no-webhook-aggregate.service';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';

describe('SerialNoWebhook Controller', () => {
  let controller: SerialNoWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SerialNoWebhookController],
      providers: [
        {
          provide: SerialNoWebhookAggregateService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(FrappeWebhookGuard)
      .useValue({})
      .compile();

    controller = module.get<SerialNoWebhookController>(
      SerialNoWebhookController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
