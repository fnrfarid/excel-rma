import { Test, TestingModule } from '@nestjs/testing';
import { CancelSalesInvoiceAggregateService } from './cancel-sales-invoice-aggregate.service';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { HttpService } from '@nestjs/common';
import { SalesInvoicePoliciesService } from '../../policies/sales-invoice-policies/sales-invoice-policies.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';

describe('CancelSalesInvoiceAggregateService', () => {
  let service: CancelSalesInvoiceAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelSalesInvoiceAggregateService,
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
          provide: ClientTokenManagerService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CancelSalesInvoiceAggregateService>(
      CancelSalesInvoiceAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
