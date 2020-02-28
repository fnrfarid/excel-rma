import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { WarrantyClaimDto } from '../../entity/warranty-claim/warranty-claim-dto';
import { WarrantyClaim } from '../../entity/warranty-claim/warranty-claim.entity';
import { WarrantyClaimAddedEvent } from '../../event/warranty-claim-added/warranty-claim-added.event';
import { WarrantyClaimService } from '../../entity/warranty-claim/warranty-claim.service';
import { WarrantyClaimRemovedEvent } from '../../event/warranty-claim-removed/warranty-claim-removed.event';
import { WarrantyClaimUpdatedEvent } from '../../event/warranty-claim-updated/warranty-claim-updated.event';
import { UpdateWarrantyClaimDto } from '../../entity/warranty-claim/update-warranty-claim-dto';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { INVALID_FILE } from '../../../constants/app-strings';
import {
  BulkWarrantyClaimInterface,
  BulkWarrantyClaim,
} from '../../entity/warranty-claim/create-bulk-warranty-claim.interface';
import { WarrantyClaimPoliciesService } from '../../policies/warranty-claim-policies/warranty-claim-policies.service';
import { SerialNoAggregateService } from '../../../serial-no/aggregates/serial-no-aggregate/serial-no-aggregate.service';
import { SerialNoDto } from '../../../serial-no/entity/serial-no/serial-no-dto';
import { BulkWarrantyClaimsCreatedEvent } from '../../event/bulk-warranty-claims-created/bulk-warranty-claims.event';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';

@Injectable()
export class WarrantyClaimAggregateService extends AggregateRoot {
  constructor(
    private readonly warrantyClaimService: WarrantyClaimService,
    private readonly warrantyClaimsPoliciesService: WarrantyClaimPoliciesService,
    private readonly serialNoAggregateService: SerialNoAggregateService,
    private readonly serialNoService: SerialNoService,
  ) {
    super();
  }

  addWarrantyClaim(warrantyClaimPayload: WarrantyClaimDto, clientHttpRequest) {
    const warrantyClaim = new WarrantyClaim();
    Object.assign(warrantyClaim, warrantyClaimPayload);
    warrantyClaim.uuid = uuidv4();
    warrantyClaim.createdOn = new Date();
    this.apply(new WarrantyClaimAddedEvent(warrantyClaim, clientHttpRequest));
  }

  async retrieveWarrantyClaim(uuid: string, req) {
    const provider = await this.warrantyClaimService.findOne({ uuid });
    if (!provider) throw new NotFoundException();
    return provider;
  }

  async getWarrantyClaimList(offset, limit, sort, filter_query?) {
    return await this.warrantyClaimService.list(
      offset,
      limit,
      sort,
      filter_query,
    );
  }

  async remove(uuid: string) {
    const found = await this.warrantyClaimService.findOne({ uuid });
    if (!found) {
      throw new NotFoundException();
    }
    this.apply(new WarrantyClaimRemovedEvent(found));
  }

  async update(updatePayload: UpdateWarrantyClaimDto) {
    const provider = await this.warrantyClaimService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!provider) {
      throw new NotFoundException();
    }
    const update = Object.assign(provider, updatePayload);
    update.modifiedOn = new Date();
    this.apply(new WarrantyClaimUpdatedEvent(update));
  }

  addBulkClaims(claimsPayload: File, clientHttpRequest) {
    return from(this.getJsonData(claimsPayload)).pipe(
      switchMap((data: BulkWarrantyClaimInterface) => {
        if (!data || !data.claims) {
          return throwError(new BadRequestException(INVALID_FILE));
        }
        return this.warrantyClaimsPoliciesService
          .validateBulkWarrantyClaim(data)
          .pipe(
            switchMap(validData => {
              this.createBulkSerials(data.claims, clientHttpRequest);
              const mappedWarranty = this.mapWarrantyClaims(data.claims);
              this.apply(new BulkWarrantyClaimsCreatedEvent(mappedWarranty));
              return of({});
            }),
          );
      }),
    );
  }

  getJsonData(file) {
    return of(JSON.parse(file.buffer));
  }

  createBulkSerials(claims: BulkWarrantyClaim[], clientHttpRequest) {
    claims.forEach(claim => {
      const serialNo: SerialNoDto = {
        supplier: claim.supplier,
        serial_no: claim.serial_no,
        claim_no: claim.claim_no,
        claim_type: claim.claim_type,
        customer_third_party: claim.customer_third_party,
        item_code: claim.item_code,
        claimed_serial: claim.claimed_serial,
        invoice_no: claim.invoice_no,
        service_charge: claim.service_charge,
        claim_status: claim.claim_status,
        warranty_status: claim.warranty_status,
        receiving_branch: claim.receiving_branch,
        delivery_branch: claim.delivery_branch,
        received_by: claim.received_by,
        delivered_by: claim.delivered_by,
        received_date: new Date(),
        deliver_date: new Date(),
      };
      return this.serialNoAggregateService
        .validateNewSerialNo(serialNo, clientHttpRequest)
        .pipe(
          switchMap(validSerialNo => {
            return from(this.serialNoService.create(validSerialNo));
          }),
        )
        .subscribe({
          next: success => {},
          error: err => {},
        });
    });
  }

  mapWarrantyClaims(claims: BulkWarrantyClaim[]) {
    const mappedClaims = [];
    claims.forEach(claim => {
      const warrantyClaim = new WarrantyClaim();
      warrantyClaim.serialNo = claim.serial_no;
      warrantyClaim.claim_no = claim.claim_no;
      warrantyClaim.claim_type = claim.claim_type;
      warrantyClaim.customer_third_party = claim.customer_third_party;
      warrantyClaim.item_code = claim.item_code;
      warrantyClaim.claimed_serial = claim.claimed_serial;
      warrantyClaim.invoice_no = claim.invoice_no;
      warrantyClaim.service_charge = claim.service_charge;
      warrantyClaim.claim_status = claim.claim_status;
      warrantyClaim.warranty_status = claim.warranty_status;
      warrantyClaim.receiving_branch = claim.receiving_branch;
      warrantyClaim.delivery_branch = claim.delivery_branch;
      warrantyClaim.received_by = claim.received_by;
      warrantyClaim.delivered_by = claim.delivered_by;
      warrantyClaim.received_date = new Date();
      warrantyClaim.deliver_date = new Date();
      warrantyClaim.uuid = uuidv4();
      mappedClaims.push(warrantyClaim);
    });
    return mappedClaims;
  }
}
