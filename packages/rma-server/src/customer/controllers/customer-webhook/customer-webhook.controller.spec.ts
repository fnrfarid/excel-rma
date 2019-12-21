import { Test, TestingModule } from '@nestjs/testing';
import { CustomerWebhookController } from './customer-webhook.controller';

describe('CustomerWebhook Controller', () => {
  let controller: CustomerWebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerWebhookController],
    }).compile();

    controller = module.get<CustomerWebhookController>(
      CustomerWebhookController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
