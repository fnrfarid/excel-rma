import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarrantyClaim } from '../../warranty-claim/entity/warranty-claim/warranty-claim.entity';
import { WarrantyClaimAnalysisService } from './warranty-claim-analysis/warranty-claim-analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([WarrantyClaim])],
  providers: [WarrantyClaimAnalysisService],
  exports: [WarrantyClaimAnalysisService],
})
export class EntityModule {}
