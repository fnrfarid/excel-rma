import {
  Injectable,
  NotFoundException,
  HttpService,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { SerialNoAddedEvent } from '../../event/serial-no-added/serial-no-added.event';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import {
  SerialNoDto,
  ValidateSerialsDto,
  ValidateReturnSerialsDto,
} from '../../entity/serial-no/serial-no-dto';
import { SerialNoRemovedEvent } from '../../event/serial-no-removed/serial-no-removed.event';
import { SerialNoUpdatedEvent } from '../../event/serial-no-updated/serial-no-updated.event';
import { SerialNo } from '../../entity/serial-no/serial-no.entity';
import { UpdateSerialNoDto } from '../../entity/serial-no/update-serial-no-dto';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap, retry } from 'rxjs/operators';
import { throwError, of, from } from 'rxjs';
import {
  AUTHORIZATION,
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
  ACCEPT,
} from '../../../constants/app-strings';
import { BEARER_HEADER_VALUE_PREFIX } from '../../../constants/app-strings';
import { FRAPPE_API_SERIAL_NO_ENDPOINT } from '../../../constants/routes';
import { SerialNoPoliciesService } from '../../policies/serial-no-policies/serial-no-policies.service';
import {
  SUPPLIER_PROJECT_QUERY,
  CUSTOMER_PROJECT_QUERY,
  ITEM_PROJECT_QUERY,
} from '../../../constants/query';
import { AssignSerialDto } from '../../entity/serial-no/assign-serial-dto';
import { AssignSerialNoPoliciesService } from '../../policies/assign-serial-no-policies/assign-serial-no-policies.service';
import { DeliveryNoteAggregateService } from '../../../delivery-note/aggregates/delivery-note-aggregate/delivery-note-aggregate.service';
import { ErrorLogService } from '../../../error-log/error-log-service/error-log.service';
import { SalesInvoiceService } from '../../../sales-invoice/entity/sales-invoice/sales-invoice.service';
import { INVALID_FILE } from '../../../constants/app-strings';

@Injectable()
export class SerialNoAggregateService extends AggregateRoot {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly serialNoPolicyService: SerialNoPoliciesService,
    private readonly assignSerialNoPolicyService: AssignSerialNoPoliciesService,
    private readonly deliveryNoteAggregateService: DeliveryNoteAggregateService,
    private readonly errorLogService: ErrorLogService,
    private readonly salesInvoiceService: SalesInvoiceService,
  ) {
    super();
  }

  addSerialNo(serialNoPayload: SerialNoDto, clientHttpRequest) {
    return this.validateNewSerialNo(serialNoPayload, clientHttpRequest).pipe(
      switchMap(serialNo => {
        this.apply(new SerialNoAddedEvent(serialNo, clientHttpRequest));
        return of({});
      }),
    );
  }

  validateNewSerialNo(serialNoPayload: SerialNoDto, clientHttpRequest) {
    return this.serialNoPolicyService.validateSerial(serialNoPayload).pipe(
      switchMap(validSerial => {
        return this.serialNoPolicyService.validateItem(serialNoPayload).pipe(
          switchMap(validItems => {
            const serialNo = new SerialNo();
            Object.assign(serialNo, serialNoPayload);
            serialNo.uuid = uuidv4();
            serialNo.isSynced = false;
            this.syncNewSerialNo(serialNo, clientHttpRequest);
            return of(serialNo);
          }),
        );
      }),
    );
  }

  async retrieveSerialNo(serial_no: string) {
    return this.serialNoService
      .asyncAggregate([
        { $match: { serial_no } },
        {
          $lookup: {
            from: 'item',
            localField: 'item_code',
            foreignField: 'item_code',
            as: 'item',
          },
        },
        {
          $lookup: {
            from: 'supplier',
            localField: 'supplier',
            foreignField: 'name',
            as: 'supplier',
          },
        },
        {
          $lookup: {
            from: 'customer',
            localField: 'customer',
            foreignField: 'name',
            as: 'customer',
          },
        },
        {
          $unwind: this.unwindQuery('$item'),
        },
        {
          $unwind: this.unwindQuery('$supplier'),
        },
        {
          $unwind: this.unwindQuery('$customer'),
        },
        {
          $project: {
            uuid: 1,
            name: 1,
            isSynced: 1,
            serial_no: 1,
            item_code: 1,
            supplier: SUPPLIER_PROJECT_QUERY,
            customer: CUSTOMER_PROJECT_QUERY,
            item: ITEM_PROJECT_QUERY,
          },
        },
      ])
      .pipe(
        switchMap((serial: any[]) => {
          if (!serial || !serial.length) {
            return throwError(new NotFoundException());
          }
          return of(serial);
        }),
      );
  }

  async getSerialNoList(offset, limit, sort, search, clientHttpRequest) {
    return this.serialNoService.list(offset, limit, search, sort);
  }

  async removeSerialNo(uuid: string) {
    const serialNo = await this.serialNoService.findOne(uuid);
    if (!serialNo) {
      throw new NotFoundException();
    }
    this.apply(new SerialNoRemovedEvent(serialNo));
  }

  async updateSerialNo(updatePayload: UpdateSerialNoDto) {
    const serialNo = await this.serialNoService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!serialNo) {
      throw new NotFoundException();
    }
    const serialNoPayload = Object.assign(serialNo, updatePayload);
    this.apply(new SerialNoUpdatedEvent(serialNoPayload));
  }

  syncNewSerialNo(serialNo: SerialNo, clientHttpRequest) {
    return this.settingsService
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings.authServerURL) {
            return throwError(new NotImplementedException());
          }
          const body = {
            serial_no: serialNo.serial_no,
            item_code: serialNo.item_code,
            warranty_expiry_date: serialNo.warranty_expiry_date,
            company: serialNo.company,
          };

          return this.http.post(
            settings.authServerURL + FRAPPE_API_SERIAL_NO_ENDPOINT,
            body,
            {
              headers: {
                [AUTHORIZATION]:
                  BEARER_HEADER_VALUE_PREFIX +
                  clientHttpRequest.token.accessToken,
                [CONTENT_TYPE]: APPLICATION_JSON_CONTENT_TYPE,
                [ACCEPT]: APPLICATION_JSON_CONTENT_TYPE,
              },
            },
          );
        }),
        retry(3),
      )
      .subscribe({
        next: response => {
          return this.serialNoService
            .updateOne(
              { uuid: serialNo.uuid },
              {
                $set: {
                  isSynced: true,
                },
              },
            )
            .then(success => {})
            .catch(error => {});
        },
        error: err => {
          this.errorLogService.createErrorLog(
            err,
            'Serial No',
            'serialNo',
            clientHttpRequest,
          );
        },
      });
  }

  unwindQuery(key) {
    return {
      path: key,
      preserveNullAndEmptyArrays: true,
    };
  }

  assignSerial(assignPayload: AssignSerialDto, clientHttpRequest) {
    return this.assignSerialNoPolicyService.validateSerial(assignPayload).pipe(
      switchMap(isValid => {
        return this.deliveryNoteAggregateService.createDeliveryNote(
          assignPayload,
          clientHttpRequest,
        );
      }),
    );
  }

  validateReturnSerials(payload: ValidateReturnSerialsDto) {
    return this.serialNoPolicyService.validateReturnSerials(payload);
  }

  validateBulkReturnSerialFile(file) {
    return from(this.getJsonData(file)).pipe(
      switchMap((data: ValidateReturnSerialsDto) => {
        if (!data) {
          return throwError(new BadRequestException(INVALID_FILE));
        }
        return this.validateReturnSerials(data);
      }),
    );
  }

  validateSerials(payload: ValidateSerialsDto) {
    return this.serialNoPolicyService.validateSerials(payload);
  }

  validateBulkSerialFile(file) {
    return from(this.getJsonData(file)).pipe(
      switchMap((data: ValidateSerialsDto) => {
        if (!data) {
          return throwError(new BadRequestException(INVALID_FILE));
        }
        return this.validateSerials(data);
      }),
    );
  }

  getJsonData(file) {
    return of(JSON.parse(file.buffer));
  }

  getPurchaseInvoiceDeliveredSerials(
    purchase_invoice_name,
    search,
    skip = 0,
    take = 10,
    clientHttpRequest,
  ) {
    return this.serialNoService.listPurchasedSerial(
      purchase_invoice_name,
      skip,
      take,
      search,
    );
  }

  getSalesInvoiceDeliveryNoteSerials(
    find,
    search,
    offset,
    limit,
    clientHttpRequest,
  ) {
    return this.salesInvoiceService
      .asyncAggregate([
        {
          $match: {
            $or: [{ uuid: find }, { name: find }],
          },
        },
        {
          $project: {
            delivery_note_items: 1,
            _id: 0,
          },
        },
        {
          $unwind: {
            path: '$delivery_note_items',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: 0,
            delivery_note_names: {
              $push: '$delivery_note_items.delivery_note',
            },
          },
        },
      ])
      .pipe(
        switchMap(delivery_note_names => {
          return from(
            this.serialNoService.listDeliveredSerial(
              delivery_note_names[0].delivery_note_names,
              search,
              offset,
              limit,
            ),
          );
        }),
      );
  }
}
