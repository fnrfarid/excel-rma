import { Test, TestingModule } from '@nestjs/testing';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { HttpService } from '@nestjs/common';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { AcceptStockEntryJobService } from './accept-stock-entry-sync.service';
import { StockEntryService } from '../../stock-entry/stock-entry.service';
import { AgendaJobService } from '../../../job-queue/entities/agenda-job/agenda-job.service';

describe('AcceptStockEntryJobService', () => {
  let service: AcceptStockEntryJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptStockEntryJobService,
        { provide: AGENDA_TOKEN, useValue: {} },
        {
          provide: DirectService,
          useValue: {},
        },
        {
          provide: AgendaJobService,
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

    service = module.get<AcceptStockEntryJobService>(
      AcceptStockEntryJobService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
