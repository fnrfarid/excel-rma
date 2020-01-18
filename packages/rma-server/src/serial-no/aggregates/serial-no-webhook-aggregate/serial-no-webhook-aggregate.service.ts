import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { SerialNoWebhookInterface } from '../../entity/serial-no/serial-no-webhook-interface';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SerialNo } from '../../entity/serial-no/serial-no.entity';
import * as uuidv4 from 'uuid/v4';

@Injectable()
export class SerialNoWebhookAggregateService extends AggregateRoot {
  constructor(private readonly serialNoService: SerialNoService) {
    super();
  }

  serialNoCreated(serialNoPayload: SerialNoWebhookInterface) {
    return from(
      this.serialNoService.findOne({ name: serialNoPayload.name }),
    ).pipe(
      switchMap(serialNo => {
        if (!serialNo) {
          const provider = new SerialNo();
          provider.uuid = uuidv4();
          provider.isSynced = true;
          Object.assign(provider, serialNoPayload);
          return this.serialNoService.create(provider);
        }
        return this.serialNoUpdated(serialNoPayload);
      }),
    );
  }

  serialNoUpdated(serialNoPayload: SerialNoWebhookInterface) {
    return from(
      this.serialNoService.findOne({ name: serialNoPayload.name }),
    ).pipe(
      switchMap(serialNo => {
        if (!serialNo) {
          return this.serialNoCreated(serialNoPayload);
        }
        return from(
          this.serialNoService.updateOne(
            { uuid: serialNo.uuid },
            { $set: serialNoPayload },
          ),
        );
      }),
    );
  }
}
