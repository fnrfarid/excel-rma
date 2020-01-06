import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RetrieveWarrantyClaimQuery } from './retrieve-warranty-claim.query';
import { WarrantyClaimAggregateService } from '../../aggregates/warranty-claim-aggregate/warranty-claim-aggregate.service';

@QueryHandler(RetrieveWarrantyClaimQuery)
export class RetrieveWarrantyClaimQueryHandler
  implements IQueryHandler<RetrieveWarrantyClaimQuery> {
  constructor(private readonly manager: WarrantyClaimAggregateService) {}

  async execute(query: RetrieveWarrantyClaimQuery) {
    const { req, uuid } = query;
    return this.manager.retrieveWarrantyClaim(uuid, req);
  }
}
