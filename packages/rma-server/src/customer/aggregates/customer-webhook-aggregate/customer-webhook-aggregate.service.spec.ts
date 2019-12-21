import { Test, TestingModule } from '@nestjs/testing';
import { CustomerWebhookAggregateService } from './customer-webhook-aggregate.service';

describe('CustomerWebhookAggregateService', () => {
  let service: CustomerWebhookAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerWebhookAggregateService],
    }).compile();

    service = module.get<CustomerWebhookAggregateService>(
      CustomerWebhookAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
