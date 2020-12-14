import { Test, TestingModule } from '@nestjs/testing';
import { StockEntryAggregateService } from './stock-entry-aggregate.service';
import { StockEntryService } from '../../entities/stock-entry.service';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { SerialBatchService } from '../../../sync/aggregates/serial-batch/serial-batch.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { SerialNoHistoryService } from '../../../serial-no/entity/serial-no-history/serial-no-history.service';
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
        {
          provide: SerialBatchService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: SerialNoService,
          useValue: {},
        },
        {
          provide: SerialNoHistoryService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
        { provide: AGENDA_TOKEN, useValue: {} },
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
