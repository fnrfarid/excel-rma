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
  state = {
    retry: false,
    reset: false,
  };
  constructor(
    public dialogRef: MatDialogRef<ViewSingleJobPage>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly jobService: JobsService,
    private readonly snackBar: MatSnackBar,
  ) {
    data.failReason = JSON.stringify(data.failReason);
    data && data.data ? this.activateState() : null;
  }

  activateState() {
    if (
      this.data.data.type === 'CREATE_PURCHASE_RECEIPT_JOB' &&
      this.data.data.status === 'Failed'
    ) {
      this.state.retry = true;
    }
    this.state.reset = true;
  }

  resetJob() {
    this.jobService.resetJob(this.data._id).subscribe({
      next: success => {
        this.snackBar.open('Job Reset Successfully.', CLOSE, {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: err => {
        this.snackBar.open(err.error.message, CLOSE, { duration: 2500 });
      },
    });
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
