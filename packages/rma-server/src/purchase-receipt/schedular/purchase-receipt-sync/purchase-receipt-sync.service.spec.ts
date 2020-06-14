import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseReceiptSyncService } from './purchase-receipt-sync.service';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { PurchaseReceiptService } from '../../entity/purchase-receipt.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { AgendaJobService } from '../../../sync/entities/agenda-job/agenda-job.service';
import { DataImportService } from '../../../sync/aggregates/data-import/data-import.service';
import { JsonToCSVParserService } from '../../../sync/entities/agenda-job/json-to-csv-parser.service';

describe('PurchaseReceiptSyncService', () => {
  let service: PurchaseReceiptSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseReceiptSyncService,
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
          provide: PurchaseReceiptService,
          useValue: {},
        },
        {
          provide: SerialNoService,
          useValue: {},
        },
        {
          provide: PurchaseInvoiceService,
          useValue: {},
        },
        {
          provide: DataImportService,
          useValue: {},
        },
        {
          provide: JsonToCSVParserService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PurchaseReceiptSyncService>(
      PurchaseReceiptSyncService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
