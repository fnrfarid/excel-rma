import {
  Injectable,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
} from '@nestjs/common';
import { SupplierService } from '../../../supplier/entity/supplier/supplier.service';
import {
  BulkWarrantyClaimInterface,
  BulkWarrantyClaim,
} from '../../entity/warranty-claim/create-bulk-warranty-claim.interface';
import { from, throwError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  SUPPLIER_NOT_FOUND,
  INVALID_WARRANTY_CLAIM_AT_POSITION,
  INVALID_CUSTOMER,
  INVALID_SERIAL_NO,
} from '../../../constants/messages';
import { CustomerService } from '../../../customer/entity/customer/customer.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';
import { WarrantyClaimDto } from '../../../warranty-claim/entity/warranty-claim/warranty-claim-dto';
import { VERDICT, WARRANTY_STATUS } from '../../../constants/app-strings';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { SerialNo } from '../../../serial-no/entity/serial-no/serial-no.entity';
import { DateTime } from 'luxon';
import { WarrantyClaimService } from '../../entity/warranty-claim/warranty-claim.service';

@Injectable()
export class WarrantyClaimPoliciesService {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly customerService: CustomerService,
    private readonly serialNoService: SerialNoService,
    private readonly warrantyService: WarrantyClaimService,
    private readonly settings: SettingsService,
  ) {}

  validateBulkWarrantyClaim(warrantyClaim: BulkWarrantyClaimInterface) {
    return this.validateWarrantySupplier(warrantyClaim.supplier).pipe(
      switchMap(valid => {
        // next validate items inside claims and validate keys for claims data
        return this.validateWarrantyClaims(warrantyClaim.claims);
      }),
    );
  }

  validateWarrantySupplier(supplierName) {
    return from(this.supplierService.findOne({ name: supplierName })).pipe(
      switchMap(supplier => {
        if (!supplier) {
          return throwError(new NotFoundException(SUPPLIER_NOT_FOUND));
        }
        return of(true);
      }),
    );
  }

  validateWarrantyClaims(claims: BulkWarrantyClaim[]) {
    let i = 0;
    claims.forEach(claim => {
      if (
        !claim.supplier ||
        !claim.serial_no ||
        !claim.item_code ||
        !claim.itemWarrantyDate ||
        !claim.company
      ) {
        return throwError(
          new BadRequestException(INVALID_WARRANTY_CLAIM_AT_POSITION + i),
        );
      }
      i++;
    });
    return of(true);
  }

  validateWarrantyCompany() {
    // validate company from settings
  }

  validateWarrantyCustomer(customer_name: string) {
    return from(this.customerService.findOne({ name: customer_name })).pipe(
      switchMap(customer => {
        if (!customer) {
          return throwError(new NotFoundException(INVALID_CUSTOMER));
        }
        return of(true);
      }),
    );
  }

  validateWarrantySerailNo(claimsPayload: WarrantyClaimDto) {
    return from(
      this.serialNoService.findOne({
        serial_no: claimsPayload.serial_no,
        item_code: claimsPayload.item_code,
      }),
    ).pipe(
      switchMap(serialNo => {
        if (!serialNo) {
          return throwError(new BadRequestException(INVALID_SERIAL_NO));
        }
        return this.validateWarrantyDate(serialNo, claimsPayload);
      }),
    );
  }

  validateWarrantyDate(serial: SerialNo, claimsPayload: WarrantyClaimDto) {
    return this.settings.find().pipe(
      switchMap(settings => {
        if (!settings) {
          settings.timeZone;
          return throwError(new NotImplementedException());
        }
        claimsPayload.warranty_end_date = serial.warranty.salesWarrantyDate;
        const warrantyEndDate = DateTime.fromISO(
          serial.warranty.salesWarrantyDate,
        ).setZone(settings.timeZone);
        const warrantyClaimDate = DateTime.fromISO(
          claimsPayload.warranty_claim_date,
        ).setZone(settings.timeZone);
        if (warrantyEndDate > warrantyClaimDate) {
          claimsPayload.warranty_status = WARRANTY_STATUS.VALID;
          return of(claimsPayload);
        }
        claimsPayload.warranty_status = WARRANTY_STATUS.EXPIRED;
        return of(claimsPayload);
      }),
    );
  }

  validateCancelClaim(uuid: string) {
    return from(
      this.warrantyService.findOne(
        { uuid },
        {
          $or: [
            { service_vouchers: { $exists: true } },
            { progress_state: { $exists: true } },
          ],
        },
      ),
    ).pipe(
      switchMap(claim => {
        if (claim) {
          return throwError(
            new BadRequestException('Claim Cannot be Cancelled'),
          );
        }
        if (
          claim.status_history[claim.status_history.length - 1].verdict ===
          VERDICT.RECEIVED_FROM_CUSTOMER
        ) {
          return of(true);
        }
        return throwError(new BadRequestException('Claim Cannot be cancelled'));
      }),
    );
  }
}
