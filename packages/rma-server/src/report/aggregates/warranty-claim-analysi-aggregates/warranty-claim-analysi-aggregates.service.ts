import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { WarrantyClaimAnalysisService } from '../../../report/entity/warranty-claim-analysis/warranty-claim-analysis.service';

@Injectable()
export class WarrantyClaimAnalysiAggregatesService extends AggregateRoot {
  constructor(
    private readonly warrantyClaimAnalysisService: WarrantyClaimAnalysisService,
  ) {
    super();
  }

  async getWarrantyClaimList(filter_query?) {
    return await this.warrantyClaimAnalysisService.list(filter_query);
  }
}
