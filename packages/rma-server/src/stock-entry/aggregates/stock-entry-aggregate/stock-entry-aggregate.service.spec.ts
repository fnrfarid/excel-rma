import { Test, TestingModule } from '@nestjs/testing';
import { StockEntryAggregateService } from './stock-entry-aggregate.service';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

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