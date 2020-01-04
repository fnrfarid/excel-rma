import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { WarrantyClaimDto } from '../../entity/warranty-claim/warranty-claim-dto';
import { WarrantyClaim } from '../../entity/warranty-claim/warranty-claim.entity';
import { WarrantyClaimAddedEvent } from '../../event/warranty-claim-added/warranty-claim-added.event';
import { WarrantyClaimService } from '../../entity/warranty-claim/warranty-claim.service';
import { WarrantyClaimRemovedEvent } from '../../event/warranty-claim-removed/warranty-claim-removed.event';
import { WarrantyClaimUpdatedEvent } from '../../event/warranty-claim-updated/warranty-claim-updated.event';
import { UpdateWarrantyClaimDto } from '../../entity/warranty-claim/update-warranty-claim-dto';

@Injectable()
export class WarrantyClaimAggregateService extends AggregateRoot {
  constructor(private readonly warrantyclaimService: WarrantyClaimService) {
    super();
  }

  addWarrantyClaim(warrantyclaimPayload: WarrantyClaimDto, clientHttpRequest) {
    const warrantyclaim = new WarrantyClaim();
    Object.assign(warrantyclaim, warrantyclaimPayload);
    warrantyclaim.uuid = uuidv4();
    this.apply(new WarrantyClaimAddedEvent(warrantyclaim, clientHttpRequest));
  }

  async retrieveWarrantyClaim(uuid: string, req) {
    const provider = await this.warrantyclaimService.findOne({ uuid });
    if (!provider) throw new NotFoundException();
    return provider;
  }

  async getWarrantyCaimList(offset, limit, sort, search, clientHttpRequest) {
    return await this.warrantyclaimService.list(offset, limit, search, sort);
  }

  async remove(uuid: string) {
    const found = await this.warrantyclaimService.findOne({ uuid });
    if (!found) {
      throw new NotFoundException();
    }
    this.apply(new WarrantyClaimRemovedEvent(found));
  }

  async update(updatePayload: UpdateWarrantyClaimDto) {
    const provider = await this.warrantyclaimService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!provider) {
      throw new NotFoundException();
    }
    const update = Object.assign(provider, updatePayload);
    this.apply(new WarrantyClaimUpdatedEvent(update));
  }
}
