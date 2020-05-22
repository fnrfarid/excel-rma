import { Test, TestingModule } from '@nestjs/testing';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { HttpService } from '@nestjs/common';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { DeliveryNoteJobService } from './delivery-note-job.service';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { AgendaJobService } from '../../../job-queue/entities/agenda-job/agenda-job.service';
import { DeliveryNoteJobHelperService } from '../../schedular/delivery-note-job-helper/delivery-note-job-helper.service';
import { JsonToCsvParserService } from '../../../sync/service/data-import/json-to-csv-parser.service';
import { DataImportService } from '../../../sync/service/data-import/data-import.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';

describe('DeliveryNoteJobService', () => {
  let service: DeliveryNoteJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryNoteJobService,
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
          provide: SerialNoService,
          useValue: {},
        },
        {
          provide: SalesInvoiceService,
          useValue: {},
        },
        {
          provide: DeliveryNoteJobHelperService,
          useValue: {},
        },
        { provide: JsonToCsvParserService, useValue: {} },
        { provide: DataImportService, useValue: {} },
        { provide: ClientTokenManagerService, useValue: {} },
      ],
    }).compile();

    service = module.get<DeliveryNoteJobService>(DeliveryNoteJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
