import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseReceiptAggregateService } from './purchase-receipt-aggregate.service';
import { HttpService } from '@nestjs/common';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { PurchaseReceiptPoliciesService } from '../../purchase-receipt-policies/purchase-receipt-policies.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { PurchaseReceiptService } from '../../entity/purchase-receipt.service';

describe('PurchaseInvoiceAggregateService', () => {
  let service: PurchaseReceiptAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseReceiptAggregateService,
        {
          provide: HttpService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {},
        },
        {
          provide: PurchaseInvoiceService,
          useValue: {},
        },
        {
          provide: ErrorLogService,
          useValue: {},
        },
        {
          provide: PurchaseReceiptService,
          useValue: {},
        },
        {
          provide: PurchaseReceiptPoliciesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PurchaseReceiptAggregateService>(
      PurchaseReceiptAggregateService,
    );
  });
  PurchaseReceiptAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
