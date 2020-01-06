import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WarrantyClaimService } from './warranty-claim.service';
import { WarrantyClaim } from './warranty-claim.entity';

describe('warrantyClaimService', () => {
  let service: WarrantyClaimService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyClaimService,
        {
          provide: getRepositoryToken(WarrantyClaim),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WarrantyClaimService>(WarrantyClaimService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
