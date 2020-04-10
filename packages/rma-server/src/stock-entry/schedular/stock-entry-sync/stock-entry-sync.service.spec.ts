import { Test, TestingModule } from '@nestjs/testing';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { HttpService } from '@nestjs/common';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { StockEntryJobService } from './stock-entry-sync.service';
import { StockEntryService } from '../../stock-entry/stock-entry.service';

describe('StockEntryJobService', () => {
  let service: StockEntryJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockEntryJobService,
        { provide: AGENDA_TOKEN, useValue: {} },
        {
          provide: DirectService,
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
        {
          provide: StockEntryService,
          useValue: {},
        },
        {
          provide: SerialNoService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<StockEntryJobService>(StockEntryJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
