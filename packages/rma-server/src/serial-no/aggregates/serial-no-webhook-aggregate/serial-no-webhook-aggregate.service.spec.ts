import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoWebhookAggregateService } from './serial-no-webhook-aggregate.service';

describe('SerialNoWebhookAggregateService', () => {
  let service: SerialNoWebhookAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerialNoWebhookAggregateService],
    }).compile();

    service = module.get<SerialNoWebhookAggregateService>(
      SerialNoWebhookAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
