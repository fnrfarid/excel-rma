import { Test, TestingModule } from '@nestjs/testing';
import { WarrantyClaimPoliciesService } from './warranty-claim-policies.service';
import { SupplierService } from '../../../supplier/entity/supplier/supplier.service';

describe('WarrantyClaimPoliciesService', () => {
  let service: WarrantyClaimPoliciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyClaimPoliciesService,
        {
          provide: SupplierService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WarrantyClaimPoliciesService>(
      WarrantyClaimPoliciesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
