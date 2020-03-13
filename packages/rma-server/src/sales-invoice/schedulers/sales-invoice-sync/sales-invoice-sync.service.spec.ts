import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoiceSyncService } from './sales-invoice-sync.service';
import { SyncAggregateService } from '../../../sync/aggregates/sync-aggregate/sync-aggregate.service';
import { RequestStateService } from '../../../direct/entities/request-state/request-state.service';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';

describe('SalesInvoiceSyncService', () => {
  let service: SalesInvoiceSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesInvoiceSyncService,
        { provide: SyncAggregateService, useValue: {} },
        { provide: SalesInvoiceService, useValue: {} },
        { provide: RequestStateService, useValue: {} },
      ],
    }).compile();

    service = module.get<SalesInvoiceSyncService>(SalesInvoiceSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
