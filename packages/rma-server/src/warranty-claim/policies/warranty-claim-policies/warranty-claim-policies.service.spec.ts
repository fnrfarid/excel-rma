import { Test, TestingModule } from '@nestjs/testing';
import { WarrantyClaimPoliciesService } from './warranty-claim-policies.service';
import { SupplierService } from '../../../supplier/entity/supplier/supplier.service';
import { CustomerService } from '../../../customer/entity/customer/customer.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';

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
        {
          provide: CustomerService,
          useValue: {},
        },
        {
          provide: SerialNoService,
          useValue: {},
        },
        {
          provide: SettingsService,
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
