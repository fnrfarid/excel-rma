import { Component, OnInit ,Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddSalesInvoicePage } from '../add-sales-invoice.page';
@Component({
  selector: 'app-draft-list',
  templateUrl: './draft-list.component.html',
  styleUrls: ['./draft-list.component.scss'],
})
export class DraftListComponent implements OnInit {
  receivedrow;
  constructor(
    private dialogRef: MatDialogRef<AddSalesInvoicePage> ,
    @Inject (MAT_DIALOG_DATA) public data : any) {
      this.receivedrow = data;
    }
      

  ngOnInit() {}

  closeDialog() {
    this.dialogRef.close()
  };
  submitPayment() {

    console.log("payment submitted !!")
  };

}
