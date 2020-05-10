import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-view-single-job',
  templateUrl: './view-single-job.page.html',
  styleUrls: ['./view-single-job.page.scss'],
})
export class ViewSingleJobPage {
  constructor(
    public dialogRef: MatDialogRef<ViewSingleJobPage>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    data.failReason = JSON.stringify(data.failReason);
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

  getParsedDate(value) {
    const date = new Date(value);
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      // +1 as index of months start's from 0
      date.getDate(),
    ].join('-');
  }
}
