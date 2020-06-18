import { Test, TestingModule } from '@nestjs/testing';
import { ServiceInvoiceAggregateService } from './service-invoice-aggregate.service';
import { ServiceInvoiceService } from '../../entity/service-invoice/service-invoice.service';

describe('ServiceInvoiceAggregateService', () => {
  let service: ServiceInvoiceAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceInvoiceAggregateService,
        {
          provide: ServiceInvoiceService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ServiceInvoiceAggregateService>(
      ServiceInvoiceAggregateService,
    );
  });
  ServiceInvoiceAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
