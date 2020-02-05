import { Module } from '@nestjs/common';
import { WarrantyClaimAggregatesManager } from './aggregates';
import { WarrantyClaimEntitiesModule } from './entity/entity.module';
import { WarrantyClaimQueryManager } from './query';
import { WarrantyClaimCommandManager } from './command';
import { WarrantyClaimEventManager } from './event';
import { WarrantyClaimController } from './controllers/warranty-claim/warranty-claim.controller';
import { WarrantyClaimPoliciesService } from './policies/warranty-claim-policies/warranty-claim-policies.service';
import { SerialNoModule } from '../serial-no/serial-no.module';
import { SupplierEntitiesModule } from '../supplier/entity/entity.module';

@Module({
  imports: [
    WarrantyClaimEntitiesModule,
    SerialNoModule,
    SupplierEntitiesModule,
  ],
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
