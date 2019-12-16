import { Test, TestingModule } from '@nestjs/testing';
import { ConnectController } from './connect.controller';
import { ConnectService } from '../../aggregates/connect/connect.service';
import { FrappeWebhookGuard } from '../../../auth/guards/frappe-webhook.guard';

describe('ConnectController', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ConnectController],
      providers: [
        {
          provide: ConnectService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(FrappeWebhookGuard)
      .useValue({})
      .compile();
  });
  it('should be defined', () => {
    const controller: ConnectController = module.get<ConnectController>(
      ConnectController,
    );
    expect(controller).toBeDefined();
  });
});
