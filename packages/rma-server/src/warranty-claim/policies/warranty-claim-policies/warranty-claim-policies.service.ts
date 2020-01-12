import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
} from '../../../constants/messages';

@Injectable()
export class WarrantyClaimPoliciesService {
  constructor(private readonly supplierService: SupplierService) {}

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
}
