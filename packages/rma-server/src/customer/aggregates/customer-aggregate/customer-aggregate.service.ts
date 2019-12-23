import { Injectable, NotFoundException } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import * as uuidv4 from 'uuid/v4';
import { CustomerAddedEvent } from '../../event/customer-added/customer-added.event';
import { CustomerService } from '../../entity/customer/customer.service';
import { CustomerDto } from '../../entity/customer/customer-dto';
import { CustomerRemovedEvent } from '../../event/customer-removed/customer-removed.event';
import { CustomerUpdatedEvent } from '../../event/customer-updated/customer-updated.event';
import { Customer } from '../../entity/customer/customer.entity';
import { UpdateCustomerDto } from '../../entity/customer/update-customer-dto';

@Injectable()
export class CustomerAggregateService extends AggregateRoot {
  constructor(private readonly customerService: CustomerService) {
    super();
  }

  addCustomer(customerPayload: CustomerDto, clientHttpRequest) {
    const customer = new Customer();
    customer.uuid = uuidv4();
    Object.assign(customer, customerPayload);
    this.apply(new CustomerAddedEvent(customer, clientHttpRequest));
  }

  async retrieveCustomer(uuid: string, req) {
    const customer = await this.customerService.findOne({ uuid });
    if (!customer) throw new NotFoundException();
    return customer;
  }

  async getCustomerList(offset, limit, sort, search, clientHttpRequest) {
    return this.customerService.list(offset, limit, search, sort);
  }

  async removeCustomer(uuid: string) {
    const customerFound = await this.customerService.findOne(uuid);
    if (!customerFound) {
      throw new NotFoundException();
    }
    this.apply(new CustomerRemovedEvent(customerFound));
  }

  async updateCustomer(updatePayload: UpdateCustomerDto) {
    const customer = await this.customerService.findOne({
      uuid: updatePayload.uuid,
    });
    if (!customer) {
      throw new NotFoundException();
    }
    const customerPayload = Object.assign(customer, updatePayload);
    this.apply(new CustomerUpdatedEvent(customerPayload));
  }
}
