import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JobsService } from '../jobs-service/jobs.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CLOSE } from '../../constants/app-string';

@Component({
  selector: 'app-view-single-job',
  templateUrl: './view-single-job.page.html',
  styleUrls: ['./view-single-job.page.scss'],
})
export class ViewSingleJobPage {
  retry = false;
  constructor(
    public dialogRef: MatDialogRef<ViewSingleJobPage>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly jobService: JobsService,
    private readonly snackBar: MatSnackBar,
  ) {
    data.failReason = JSON.stringify(data.failReason);
    if (
      data &&
      data.data &&
      data.data.type === 'CREATE_PURCHASE_RECEIPT_JOB' &&
      data.data.status === 'Failed'
    ) {
      this.retry = true;
    }
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

  retryJob() {
    this.jobService.retryJob(this.data._id).subscribe({
      next: success => {
        this.snackBar.open('Job Requeued Successfully.', CLOSE, {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: err => {
        this.snackBar.open('Fail to retry job: ' + err.message);
      },
    });
  }
}
