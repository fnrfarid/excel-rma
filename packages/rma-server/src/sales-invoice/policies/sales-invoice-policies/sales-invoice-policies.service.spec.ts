import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoicePoliciesService } from './sales-invoice-policies.service';

describe('SalesInvoicePoliciesService', () => {
  let service: SalesInvoicePoliciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesInvoicePoliciesService],
    }).compile();

    service = module.get<SalesInvoicePoliciesService>(
      SalesInvoicePoliciesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
