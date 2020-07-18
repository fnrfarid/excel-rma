import { Test, TestingModule } from '@nestjs/testing';
import { WarrantyStockEntryAggregateService } from './warranty-stock-entry-aggregate.service';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { StockEntryPoliciesService } from '../../policies/stock-entry-policies/stock-entry-policies.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { HttpService } from '@nestjs/common';

describe('WarrantyStockEntryAggregateService', () => {
  let service: WarrantyStockEntryAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyStockEntryAggregateService,
        {
          provide: StockEntryService,
          useValue: {},
        },
        {
          provide: StockEntryPoliciesService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WarrantyStockEntryAggregateService>(
      WarrantyStockEntryAggregateService,
    );
  });
  WarrantyStockEntryAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
