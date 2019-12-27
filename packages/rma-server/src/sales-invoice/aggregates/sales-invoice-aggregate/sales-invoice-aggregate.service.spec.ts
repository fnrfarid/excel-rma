import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoiceAggregateService } from './sales-invoice-aggregate.service';
import { SalesInvoiceService } from '../../entity/sales-invoice/sales-invoice.service';
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
