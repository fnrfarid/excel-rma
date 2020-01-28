import { NgModule } from '@angular/core';
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { CommonModule, CurrencyPipe } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  declarations: [CurrencyFormatPipe],
  providers: [CurrencyPipe],
  exports: [CurrencyFormatPipe],
})
export class AppCommonModule {}
