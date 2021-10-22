import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WarrantyClaim } from '../../../warranty-claim/entity/warranty-claim/warranty-claim.entity';
import { WarrantyClaimAnalysisService } from './warranty-claim-analysis.service';

describe('WarrantyClaimAnalysisService', () => {
  let service: WarrantyClaimAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyClaimAnalysisService,
        {
          provide: getRepositoryToken(WarrantyClaim),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WarrantyClaimAnalysisService>(
      WarrantyClaimAnalysisService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
