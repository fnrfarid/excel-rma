import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderAggregateService } from './purchase-order-aggregate.service';
import { PurchaseOrderService } from '../../entity/purchase-order/purchase-order.service';

describe('PurchaseOrderAggregateService', () => {
  let service: PurchaseOrderAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderAggregateService,
        { provide: PurchaseOrderService, useValue: {} },
      ],
    }).compile();

    service = module.get<PurchaseOrderAggregateService>(
      PurchaseOrderAggregateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
