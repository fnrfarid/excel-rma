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
  exportedJob: any;
  message: string;

  constructor(
    public dialogRef: MatDialogRef<ViewSingleJobPage>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly jobService: JobsService,
    private readonly snackBar: MatSnackBar,
  ) {
    if (
      data &&
      data.data &&
      data.data.status &&
      data.data.status === 'Exported' &&
      data.data.uuid
    ) {
      this.getExportedJob(data);
    }
  }

  activateState() {
    if (this.exportedJob.data.status === 'Failed') {
      this.state.retry = true;
      this.state.reset = true;
    }
  }

  getExportedJob(data: JobInterface) {
    this.jobService.getExportedJob(data).subscribe({
      next: (response: { data: any }) => {
        this.exportedJob = response;
        this.getMessage();
        this.activateState();
      },
      error: err => {
        this.snackBar.open(
          err && err.error && err.error.message
            ? err.error.message
            : 'Failed to fetch exported JOB',
          CLOSE,
          { duration: 3500 },
        );
      },
    });
  }

  getMessage() {
    if (this.exportedJob.data.status !== 'Failed') {
      this.message = `<p>Following job is: ${
        this.exportedJob.data.status || 'In Progress'
      }, it will be synced once successful, you can check the progress here.</p>`;
      return;
    }

    try {
      const log_details = this.exportedJob.failReason.log_details;
      this.message = JSON.parse(log_details).messages[0].message;
    } catch {
      return this.exportedJob.failReason.log_details;
    }
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

export class JobInterface {
  name: string;
  failedAt: string;
  failCount: string;
  failReason: string;
  data: {
    status: string;
    parent: string;
    payload: any;
    token: {
      fullName: string;
    };
    sales_invoice_name: string;
    uuid: string;
    type: string;
  };
}
