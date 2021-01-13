import { HttpModule, Module } from '@nestjs/common';
import { PrintAggregateManager } from './aggregates';
import { PrintController } from './controller/print/print.controller';

@Module({
  imports: [HttpModule],
  controllers: [PrintController],
  providers: [...PrintAggregateManager],
  exports: [],
})
export class PrintModule {}
