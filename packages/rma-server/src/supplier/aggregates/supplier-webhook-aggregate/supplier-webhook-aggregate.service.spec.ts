import { Test, TestingModule } from '@nestjs/testing';
import { SupplierWebhookAggregateService } from './supplier-webhook-aggregate.service';

describe('SupplierWebhookAggregateService', () => {
  let service: SupplierWebhookAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierWebhookAggregateService],
    }).compile();

    service = module.get<SupplierWebhookAggregateService>(
      SupplierWebhookAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
