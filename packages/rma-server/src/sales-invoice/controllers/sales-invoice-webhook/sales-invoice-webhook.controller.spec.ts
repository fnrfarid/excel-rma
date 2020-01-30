import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoiceWebhookController } from './sales-invoice-webhook.controller';
import { SalesInvoiceWebhookAggregateService } from '../../aggregates/sales-invoice-webhook-aggregate/sales-invoice-webhook-aggregate.service';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';

describe('SalesInvoiceWebhook Controller', () => {
  let controller: SalesInvoiceWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SalesInvoiceWebhookAggregateService,
          useValue: {},
        },
      ],
      controllers: [SalesInvoiceWebhookController],
    })
      .overrideGuard(FrappeWebhookGuard)
      .useValue({})
      .compile();

    controller = module.get<SalesInvoiceWebhookController>(
      SalesInvoiceWebhookController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
