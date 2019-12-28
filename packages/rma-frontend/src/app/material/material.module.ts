import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatTableModule,
  MatInputModule,
  MatButtonModule,
} from '@angular/material';
import { SatPopoverModule } from '@ncstate/sat-popover';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatTableModule,
    SatPopoverModule,
    MatInputModule,
    MatButtonModule,
  ],
  exports: [MatTableModule, SatPopoverModule, MatInputModule, MatButtonModule],
})
export class MaterialModule {}
