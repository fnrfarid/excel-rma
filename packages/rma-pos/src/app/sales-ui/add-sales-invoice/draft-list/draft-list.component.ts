import { Component, OnInit ,Inject} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddSalesInvoicePage } from '../add-sales-invoice.page';
import { MatTableDataSource } from '@angular/material/table';
import { ItemsDataSource } from '../items-datasource';
import {
  FormGroup,
  FormArray,
} from '@angular/forms';

@Component({
  selector: 'app-draft-list',
  templateUrl: './draft-list.component.html',
  styleUrls: ['./draft-list.component.scss'],
})
export class DraftListComponent implements OnInit {
  dataSource: ItemsDataSource;
  dataSource2;
  dataSource3;
  draft_uuid: string;
  salesCustomerDetialsForm: FormGroup;
  addsales:any;
  itemsControl: FormArray = this.data.form.get(
    'items',
  ) as FormArray;
  number_items:any;

  public dialog: MatDialog

  displayedColumnsItems = [
    'date',
    'time',
    'customerName',
    'amount',
    'uuid'
  ]
  constructor(
    private dialogRef: MatDialogRef<AddSalesInvoicePage> ,

    @Inject (MAT_DIALOG_DATA) public data : any) {
      // this.receivedrow = data;
      this.dataSource2 = new MatTableDataSource(data.UI);
      this.dataSource3=data.source
    }
      
  ngOnInit() {
    this.dataSource = new ItemsDataSource();
  }
  closeDialog() {
    this.dialogRef.close()
  };
  submitPayment() {

    console.log("payment submitted !!")
  };



  editDraftList(event){

    var targetedObject :any = "";

    // get targeted object from array of drafts
    for (let i = 0; i < this.dataSource3.length; i++) {
      if (this.dataSource3[i].uuid == event.target.innerHTML) {
        targetedObject = this.dataSource3[i];
      }
    };
    this.draft_uuid = targetedObject.uuid // added uuid
    this.data.formgroup
      .get('territory',)
        .setValue(targetedObject.territory);
        this.data.formgroup
      .get('warehouse')
        .setValue(targetedObject.warehouse);
        this.data.formgroup
      .get('mobileNo')
        .setValue(targetedObject.mobile);
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
    this.dialogRef.close({data:targetedObject,uuid:this.draft_uuid}) // sent uuid to parent comp
  }

}
