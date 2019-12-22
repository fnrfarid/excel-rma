import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoAggregateService } from './serial-no-aggregate.service';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
describe('SerialNoAggregateService', () => {
  let service: SerialNoAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialNoAggregateService,
        {
          provide: SerialNoService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SerialNoAggregateService>(SerialNoAggregateService);
  });
  SerialNoAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
