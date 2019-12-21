import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer/customer.entity';
import { CustomerService } from './customer/customer.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), CqrsModule],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerEntitiesModule {}
