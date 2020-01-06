import { Test, TestingModule } from '@nestjs/testing';
import { WarrantyClaimAggregateService } from './warranty-claim-aggregate.service';
import { WarrantyClaimService } from '../../../warranty-claim/entity/warranty-claim/warranty-claim.service';
describe('warrantyClaimAggregateService', () => {
  let service: WarrantyClaimAggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyClaimAggregateService,
        {
          provide: WarrantyClaimService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WarrantyClaimAggregateService>(
      WarrantyClaimAggregateService,
    );
  });
  WarrantyClaimAggregateService;
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
