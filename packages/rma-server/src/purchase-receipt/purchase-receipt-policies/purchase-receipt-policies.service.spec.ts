import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseReceiptPoliciesService } from './purchase-receipt-policies.service';
import { SerialNoService } from '../../serial-no/entity/serial-no/serial-no.service';
import { PurchaseInvoiceService } from '../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';

describe('PurchaseReceiptPoliciesService', () => {
  let service: PurchaseReceiptPoliciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseReceiptPoliciesService,
        {
          provide: SerialNoService,
          useValue: {},
        },
        {
          provide: PurchaseInvoiceService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PurchaseReceiptPoliciesService>(
      PurchaseReceiptPoliciesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
