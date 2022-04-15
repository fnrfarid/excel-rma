import { Component, OnInit ,Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddSalesInvoicePage } from '../add-sales-invoice.page';
import { MatTableDataSource } from '@angular/material/table';
import {
  FormGroup
} from '@angular/forms';

@Component({
  selector: 'app-draft-list',
  templateUrl: './draft-list.component.html',
  styleUrls: ['./draft-list.component.scss'],
})
export class DraftListComponent implements OnInit {
  dataSource2;
  dataSource3;
  salesCustomerDetialsForm: FormGroup;
  addsales:any;

  public dialog: MatDialog

  displayedColumnsItems = [
    'uuid',
    'customerName',
    'amount'
  ]
  constructor(
    private dialogRef: MatDialogRef<AddSalesInvoicePage> ,

    @Inject (MAT_DIALOG_DATA) public data : any) {
      // this.receivedrow = data;
      this.dataSource2 = new MatTableDataSource(data.UI);
      this.dataSource3=data.source
    }
      
  ngOnInit() {
  }
  closeDialog() {
    debugger
    this.dialogRef.close()
  };
  submitPayment() {

    console.log("payment submitted !!")
  };

  editDraftList(event){
    debugger

    var targetedObject :any = "";

    // get targeted object from array of drafts
    for (let i = 0; i < this.dataSource3.length; i++) {
      if (this.dataSource3[i].uuid == event.target.innerHTML) {
        targetedObject = this.dataSource3[i];
      }
    };
    
    this.data.formgroup
      .get('territory',)
        .setValue(targetedObject.territory);
        this.data.formgroup
      .get('warehouse')
        .setValue(targetedObject.warehouse);
        this.data.formgroup
      .get('campaign',)
        .setValue(targetedObject.isCampaign);
        this.data.formgroup
      .get('balance')
        .setValue(targetedObject.remaining_balance);
        this.data.formgroup
      .get('remarks')
        .setValue(targetedObject.remarks);    
        this.data.formgroup
      .get('customer')
        .setValue(targetedObject.customer);
        this.data.formgroup
      .get('dueDate')
        .setValue(new Date(targetedObject.due_date));
    for (let i = 0; i < targetedObject.items.length; i++){

      this.addsales.addFromItemsGrid(targetedObject.items[i])
    }
    this.dialogRef.close()
  }

}
