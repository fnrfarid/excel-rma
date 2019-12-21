import { Test, TestingModule } from '@nestjs/testing';
import { CustomerAggregateService } from './customer-aggregate.service';
import { CustomerService } from '../../entity/customer/customer.service';
describe('customerAggregateService', () => {
  let service: CustomerAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAggregateService,
        {
          provide: CustomerService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CustomerAggregateService>(CustomerAggregateService);
  });
  CustomerAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
