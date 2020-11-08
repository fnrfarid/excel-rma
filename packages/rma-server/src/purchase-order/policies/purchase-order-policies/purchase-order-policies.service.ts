import { BadRequestException, Injectable } from '@nestjs/common';
import { PurchaseInvoiceService } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.service';
import { from, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PURCHASE_INVOICE_STATUS } from '../../../constants/app-strings';
import { PurchaseInvoice } from '../../../purchase-invoice/entity/purchase-invoice/purchase-invoice.entity';
import { PurchaseOrderService } from '../../entity/purchase-order/purchase-order.service';
import { SerialNoService } from '../../../serial-no/entity/serial-no/serial-no.service';

@Injectable()
export class PurchaseOrderPoliciesService {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly serialNoService: SerialNoService,
  ) {}

  validatePurchaseOrderReset(name: string) {
    return this.validatePurchaseInvoice(name).pipe(
      switchMap(invoice => {
        return this.validatePurchaseSerials(invoice);
      }),
      switchMap(invoice => {
        return this.validateSerialState(invoice);
      }),
    );
  }

  validatePurchaseInvoice(name) {
    return from(this.purchaseInvoiceService.findOne({ name })).pipe(
      switchMap(invoice => {
        if (!invoice) {
          return throwError(
            new BadRequestException('Purchase Invoice Not found'),
          );
        }
        if (
          [
            PURCHASE_INVOICE_STATUS.RESETED,
            PURCHASE_INVOICE_STATUS.CANCELED,
          ].includes(invoice.status)
        ) {
          return throwError(
            new BadRequestException(
              `Purchase Invoice with status ${invoice.status} cannot be reseted.`,
            ),
          );
        }
        return from(
          this.purchaseOrderService.findOne({ purchase_invoice_name: name }),
        ).pipe(
          switchMap(order => {
            if (!order) {
              return throwError(
                new BadRequestException('Purchase Order Not found'),
              );
            }
            if (order.docstatus === 2) {
              return throwError(
                new BadRequestException(
                  `Canceled Purchase order cannot be reseted.`,
                ),
              );
            }
            return of(invoice);
          }),
        );
      }),
    );
  }

  validateSerialState(invoice: PurchaseInvoice) {
    return from(
      this.serialNoService.count({
        purchase_invoice_name: invoice.name,
        queue_state: { $gt: {} },
      }),
    ).pipe(
      switchMap(count => {
        if (count) {
          return throwError(
            new BadRequestException(
              `Found ${count} serials to be already in queue, please reset queue to proceed.`,
            ),
          );
        }
        return of(true);
      }),
    );
  }

  validatePurchaseSerials(invoice: PurchaseInvoice) {
    return this.serialNoService
      .asyncAggregate([
        {
          $match: {
            purchase_invoice_name: invoice.name,
          },
        },
        {
          $project: {
            _id: 1,
            serial_no: 1,
          },
        },
        {
          $lookup: {
            from: 'serial_no_history',
            localField: 'serial_no',
            foreignField: 'serial_no',
            as: 'history',
          },
        },
        { $unwind: '$history' },
        {
          $group: {
            _id: '$serial_no',
            historyEvents: { $sum: 1 },
          },
        },
        {
          $redact: {
            $cond: {
              if: {
                $gt: ['$historyEvents', 1],
              },
              then: '$$KEEP',
              else: '$$PRUNE',
            },
          },
        },
      ])
      .pipe(
        switchMap((data: { _id: string; historyEvents: number }[]) => {
          if (data?.length) {
            const serialEventsMessage = data
              .splice(0, 5)
              .filter(element => `${element._id} has ${element.historyEvents}`)
              .join(', ');
            return throwError(
              new BadRequestException(
                `Found ${data.length} Serials having multiple events : 
          ${serialEventsMessage}..`,
              ),
            );
          }
          return of(invoice);
        }),
      );
  }
}
