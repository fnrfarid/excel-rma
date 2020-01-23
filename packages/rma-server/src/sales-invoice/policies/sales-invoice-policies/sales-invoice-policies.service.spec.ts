import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoicePoliciesService } from './sales-invoice-policies.service';
import { CustomerService } from '../../../customer/entity/customer/customer.service';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { AssignSerialNoPoliciesService } from '../../../serial-no/policies/assign-serial-no-policies/assign-serial-no-policies.service';

describe('SalesInvoicePoliciesService', () => {
  let service: SalesInvoicePoliciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesInvoicePoliciesService,
        {
          provide: SalesInvoiceService,
          useValue: {},
        },
        {
          provide: CustomerService,
          useValue: {},
        },
        {
          provide: AssignSerialNoPoliciesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesInvoicePoliciesService>(
      SalesInvoicePoliciesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
