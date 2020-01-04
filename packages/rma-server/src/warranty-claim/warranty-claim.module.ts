import { Module, HttpModule } from '@nestjs/common';
import { WarrantyClaimAggregatesManager } from './aggregates';
import { WarrantyClaimEntitiesModule } from './entity/entity.module';
import { WarrantyClaimQueryManager } from './query';
import { CqrsModule } from '@nestjs/cqrs';
import { WarrantyClaimCommandManager } from './command';
import { WarrantyClaimEventManager } from './event';
import { WarrantyClaimController } from './controllers/warranty-claim/warranty-claim.controller';
import { WarrantyClaimPoliciesService } from './policies/warranty-claim-policies/warranty-claim-policies.service';

@Module({
  imports: [WarrantyClaimEntitiesModule, CqrsModule, HttpModule],
  controllers: [WarrantyClaimController],
  providers: [
    ...WarrantyClaimAggregatesManager,
    ...WarrantyClaimQueryManager,
    ...WarrantyClaimEventManager,
    ...WarrantyClaimCommandManager,
    WarrantyClaimPoliciesService,
  ],
  exports: [WarrantyClaimEntitiesModule],
})
export class WarrantyClaimModule {}
