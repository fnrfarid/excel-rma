import { NgModule } from '@angular/core';
import { CurFormatPipe } from './pipes/currency.pipe';
import { CommonModule, CurrencyPipe } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  declarations: [CurFormatPipe],
  providers: [CurrencyPipe],
  exports: [CurFormatPipe],
})
export class AppCommonModule {}
