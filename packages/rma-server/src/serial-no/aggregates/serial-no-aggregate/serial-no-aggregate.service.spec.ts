import { Test, TestingModule } from '@nestjs/testing';
import { SerialNoAggregateService } from './serial-no-aggregate.service';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { HttpService } from '@nestjs/common';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
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
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: SettingsService,
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
