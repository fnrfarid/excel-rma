import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl } from '@angular/forms';
@Component({
  selector: 'app-add-warranty-claim',
  templateUrl: './add-warranty-claim.page.html',
  styleUrls: ['./add-warranty-claim.page.scss'],
})
export class AddWarrantyClaimPage implements OnInit {
  constructor(private location: Location) {}

  ngOnInit() {}
  problem = new FormControl();
  warrantyClaimState = {
    claim: '',
    receivedOn: '',
  };
  receivedOnFormControl = new FormControl();
  claimList: string[] = [
    'Regular Claim',
    'Non Serial Warranty',
    'Third Party Warranty',
  ];
  problemList: string[] = [
    'Problem 1',
    'Problem 2',
    'Problem 3',
    'Problem 4',
    'Problem 5',
    'Problem 6',
  ];
  navigateBack() {
    this.location.back();
  }

  claimTypeChangeEvent($event) {}

  receivedOnChangeEvent() {}
}
