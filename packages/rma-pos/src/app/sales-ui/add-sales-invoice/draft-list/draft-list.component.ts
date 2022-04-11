import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-draft-list',
  templateUrl: './draft-list.component.html',
  styleUrls: ['./draft-list.component.scss'],
})
export class DraftListComponent implements OnInit {

  constructor(private dialog: MatDialogRef<DraftListComponent> ) { }

  ngOnInit() {}

  closeDialog() {
    this.dialog.close()
  };
  submitPayment() {
    console.log("payment submitted !!")
  };

}
