import { Module, HttpModule } from '@nestjs/common';
import { CreditNoteController } from './controller/credit-note.controller';
import { CreditNoteService } from './credit-note-service/credit-note.service';
@Module({
  imports: [HttpModule],
  controllers: [CreditNoteController],
  providers: [CreditNoteService],
  exports: [],
})
export class CreditNoteModule {}
