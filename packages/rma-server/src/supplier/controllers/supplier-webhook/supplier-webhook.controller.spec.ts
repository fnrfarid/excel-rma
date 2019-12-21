import { Test, TestingModule } from '@nestjs/testing';
import { SupplierWebhookController } from './supplier-webhook.controller';

describe('supplierWebhook Controller', () => {
  let controller: SupplierWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierWebhookController],
    }).compile();

    controller = module.get<SupplierWebhookController>(
      SupplierWebhookController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
