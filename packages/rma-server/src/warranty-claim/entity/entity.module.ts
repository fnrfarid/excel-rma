import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarrantyClaim } from './warranty-claim/warranty-claim.entity';
import { WarrantyClaimService } from './warranty-claim/warranty-claim.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [TypeOrmModule.forFeature([WarrantyClaim]), CqrsModule],
  providers: [WarrantyClaimService],
  exports: [WarrantyClaimService],
})
export class WarrantyClaimEntitiesModule {}
