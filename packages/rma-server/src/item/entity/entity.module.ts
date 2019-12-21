import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemService } from './item/item.service';
import { CqrsModule } from '@nestjs/cqrs';
import { Item } from './item/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item]), CqrsModule],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemEntitiesModule {}
