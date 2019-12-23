import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { SerialNoAddedEvent } from '../../event/serial-no-added/serial-no-added.event';
import { SerialNoService } from '../../entity/serial-no/serial-no.service';
import { SerialNoDto } from '../../entity/serial-no/serial-no-dto';
import { SerialNoRemovedEvent } from '../../event/serial-no-removed/serial-no-removed.event';
import { SerialNoUpdatedEvent } from '../../event/serial-no-updated/serial-no-updated.event';
import { SerialNo } from '../../entity/serial-no/serial-no.entity';
import { UpdateSerialNoDto } from '../../entity/serial-no/update-serial-no-dto';

@Injectable()
export class SerialNoAggregateService extends AggregateRoot {
  constructor(private readonly serialNoService: SerialNoService) {
    super();
  }

  addSerialNo(serialNoPayload: SerialNoDto, clientHttpRequest) {
    const serialNo = new SerialNo();
    serialNo.uuid = uuidv4();
    Object.assign(serialNo, serialNoPayload);
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
}
