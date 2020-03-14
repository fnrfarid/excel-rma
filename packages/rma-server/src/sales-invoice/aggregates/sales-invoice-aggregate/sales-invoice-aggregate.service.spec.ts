import { Test, TestingModule } from '@nestjs/testing';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { SalesInvoiceAggregateService } from './sales-invoice-aggregate.service';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { HttpService } from '@nestjs/common';
import { SalesInvoicePoliciesService } from '../../../sales-invoice/policies/sales-invoice-policies/sales-invoice-policies.service';
import { DeliveryNoteService } from '../../../delivery-note/entity/delivery-note-service/delivery-note.service';
import { DirectService } from '../../../direct/aggregates/direct/direct.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';

describe('SalesInvoiceAggregateService', () => {
  let service: SalesInvoiceAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesInvoiceAggregateService,
        {
          provide: SalesInvoiceService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: ErrorLogService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: SalesInvoicePoliciesService,
          useValue: {},
        },
        {
          provide: DeliveryNoteService,
          useValue: {},
        },
        {
          provide: DirectService,
          useValue: {},
        },
        {
          provide: ClientTokenManagerService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesInvoiceAggregateService>(
      SalesInvoiceAggregateService,
    );
  });
  SalesInvoiceAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
