import { Test, TestingModule } from '@nestjs/testing';
import { WarrantyClaimAnalysisService } from '../../../report/entity/warranty-claim-analysis/warranty-claim-analysis.service';
import { WarrantyClaimAnalysiAggregatesService } from './warranty-claim-analysi-aggregates.service';

describe('WarrantyClaimAnalysiAggregatesService', () => {
  let service: WarrantyClaimAnalysiAggregatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyClaimAnalysiAggregatesService,
        {
          provide: WarrantyClaimAnalysisService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WarrantyClaimAnalysiAggregatesService>(
      WarrantyClaimAnalysiAggregatesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
