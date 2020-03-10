import { Test, TestingModule } from '@nestjs/testing';
import { StockEntryAggregateService } from './stock-entry-aggregate.service';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryPoliciesService } from '../../stock-entry-policies/stock-entry-policies.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { HttpService } from '@nestjs/common';

describe('StockEntryAggregateService', () => {
  let service: StockEntryAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockEntryAggregateService,
        {
          provide: StockEntryService,
          useValue: {},
        },
        {
          provide: StockEntryPoliciesService,
          useValue: {},
        },
        { provide: SettingsService, useValue: {} },
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: ErrorLogService,
          useValue: {},
        },
        {
          provide: SerialNoService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<StockEntryAggregateService>(
      StockEntryAggregateService,
    );
  });
  StockEntryAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
