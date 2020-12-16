import { Test, TestingModule } from '@nestjs/testing';
import { StockEntryPoliciesService } from './stock-entry-policies.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoHistoryPoliciesService } from '../../../serial-no/policies/serial-no-history-policies/serial-no-history-policies.service';

describe('StockEntryPoliciesService', () => {
  let service: StockEntryPoliciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockEntryPoliciesService,
        {
          provide: SerialNoService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: SerialNoHistoryPoliciesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<StockEntryPoliciesService>(StockEntryPoliciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
