import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoWebhookAggregateService } from './serial-no-webhook-aggregate.service';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';

describe('SerialNoWebhookAggregateService', () => {
  let service: SerialNoWebhookAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialNoWebhookAggregateService,
        {
          provide: SerialNoService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SerialNoWebhookAggregateService>(
      SerialNoWebhookAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
