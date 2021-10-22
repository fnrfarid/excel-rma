import { Module } from '@nestjs/common';
import { WarrantyClaimAnalysisController } from './controllers/warranty-claim-analysis/warranty-claim-analysis.controller';
import { EntityModule } from './entity/entity.module';
import { WarrantyClaimAnalysiAggregatesService } from './aggregates/warranty-claim-analysi-aggregates/warranty-claim-analysi-aggregates.service';

@Module({
  controllers: [WarrantyClaimAnalysisController],
  imports: [EntityModule],
  providers: [WarrantyClaimAnalysiAggregatesService],
})
export class ReportModule {}
