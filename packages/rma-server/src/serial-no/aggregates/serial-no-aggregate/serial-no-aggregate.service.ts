import {
  Injectable,
  NotFoundException,
  HttpService,
  NotImplementedException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { SerialNoAddedEvent } from '../../event/serial-no-added/serial-no-added.event';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNoDto } from '../../entity/serial-no/serial-no-dto';
import { SerialNoRemovedEvent } from '../../event/serial-no-removed/serial-no-removed.event';
import { SerialNoUpdatedEvent } from '../../event/serial-no-updated/serial-no-updated.event';
import { SerialNo } from '../../entity/serial-no/serial-no.entity';
import { UpdateSerialNoDto } from '../../entity/serial-no/update-serial-no-dto';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  AUTHORIZATION,
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
  ACCEPT,
} from '../../../constants/app-strings';
import { BEARER_HEADER_VALUE_PREFIX } from '../../../constants/app-strings';
import { FRAPPE_API_SERIAL_NO_ENDPOINT } from '../../../constants/routes';

@Injectable()
export class SerialNoAggregateService extends AggregateRoot {
  constructor(
    private readonly serialNoService: SerialNoService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }

  addSerialNo(serialNoPayload: SerialNoDto, clientHttpRequest) {
    const serialNo = new SerialNo();
    Object.assign(serialNo, serialNoPayload);
    serialNo.uuid = uuidv4();
    serialNo.isSynced = false;
    this.syncNewSerialNo(serialNo, clientHttpRequest);
    this.apply(new SerialNoAddedEvent(serialNo, clientHttpRequest));
  }

  async retrieveSerialNo(uuid: string, req) {
    const serialNo = await this.serialNoService.findOne({ uuid });
    if (!serialNo) throw new NotFoundException();
    return serialNo;
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
        error: err => {},
      });
  }
}
