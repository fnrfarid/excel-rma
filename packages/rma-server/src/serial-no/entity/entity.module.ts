import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerialNo } from './serial-no/serial-no.entity';
import { SerialNoService } from './serial-no/serial-no.service';

@Module({
  imports: [TypeOrmModule.forFeature([SerialNo])],
  providers: [SerialNoService],
  exports: [SerialNoService],
})
export class SerialNoEntitiesModule {}
