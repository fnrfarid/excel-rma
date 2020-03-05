import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
@Component({
  selector: 'view-warranty-claims',
  templateUrl: './view-warranty-claims.page.html',
  styleUrls: ['./view-warranty-claims.page.scss'],
})
export class ViewWarrantyClaimsPage implements OnInit {
  selectedSegment: any;
  constructor(private readonly location: Location) {}

  ngOnInit() {
    this.selectedSegment = 0;
  }
  navigateBack() {
    this.location.back();
  }
}
