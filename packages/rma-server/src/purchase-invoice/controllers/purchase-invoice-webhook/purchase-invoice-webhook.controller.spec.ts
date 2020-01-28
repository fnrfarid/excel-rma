import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoiceWebhookController } from './purchase-invoice-webhook.controller';
import { PurchaseInvoiceWebhookAggregateService } from '../../../purchase-invoice/aggregates/purchase-invoice-webhook-aggregate/purchase-invoice-webhook-aggregate.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';

describe('PurchaseInvoiceWebhook Controller', () => {
  let controller: PurchaseInvoiceWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PurchaseInvoiceWebhookAggregateService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
      ],
      controllers: [PurchaseInvoiceWebhookController],
    }).compile();

    controller = module.get<PurchaseInvoiceWebhookController>(
      PurchaseInvoiceWebhookController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
