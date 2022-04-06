import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-payment-dialogue',
  templateUrl: './payment-dialogue.component.html',
  styleUrls: ['./payment-dialogue.component.scss'],
})
export class PaymentDialogueComponent implements OnInit {

  constructor(private dialog: MatDialogRef<PaymentDialogueComponent> ) {

   }
  
  ngOnInit() {}

  closeDialog() {
    this.dialog.close()
  };
  submitPayment() {
    console.log("payment submitted !!")
  };
}
