import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoiceWebhookAggregateService } from './sales-invoice-webhook-aggregate.service';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';

describe('SalesInvoiceWebhookAggregateService', () => {
  let service: SalesInvoiceWebhookAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesInvoiceWebhookAggregateService,
        {
          provide: SalesInvoiceService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesInvoiceWebhookAggregateService>(
      SalesInvoiceWebhookAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
