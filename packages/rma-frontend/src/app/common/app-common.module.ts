import { NgModule } from '@angular/core';
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { SerialsService } from './helpers/serials/serials.service';

@NgModule({
  imports: [CommonModule],
  declarations: [CurrencyFormatPipe],
  providers: [CurrencyPipe, SerialsService],
  exports: [CurrencyFormatPipe, SerialsService],
})
export class AppCommonModule {}
