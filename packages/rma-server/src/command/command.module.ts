import { Module, HttpModule } from '@nestjs/common';
import { CommandController } from './controllers/command/command.controller';
import { CommandService } from './aggregates/command/command.service';

@Module({
  imports: [HttpModule],
  controllers: [CommandController],
  providers: [CommandService],
})
export class CommandModule {}
