import { Component, OnInit, Input } from '@angular/core';
import {
  WarrantyClaimsDetails,
  StatusHistoryDetails,
} from '../../../common/interfaces/warranty.interface';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { debounceTime, startWith, switchMap, map } from 'rxjs/operators';
import { StatusHistoryService } from './status-history.service';
import { TimeService } from '../../../api/time/time.service';
import {
  CURRENT_STATUS_VERDICT,
  DELIVERY_STATUS,
  DURATION,
} from '../../../constants/app-string';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  STATUS_HISTORY_ADD_FAILURE,
  STATUS_HISTORY_REMOVE_FAILURE,
} from '../../../constants/messages';

@Component({
  selector: 'status-history',
  templateUrl: './status-history.component.html',
  styleUrls: ['./status-history.component.scss'],
})
export class StatusHistoryComponent implements OnInit {
  @Input()
  warrantyObject: WarrantyClaimsDetails;
  statusHistoryForm: FormGroup;
  territoryList: any = [];
  currentStatus: any = [];
  deliveryStatus: any = [];
  posting_date: { date: string; time: string };
  status: any;

  displayedColumns = [
    'posting_date',
    'time',
    'status_from',
    'transfer_branch',
    'verdict',
    'description',
    'delivery_status',
    'status',
    'rollback',
  ];
  constructor(
    private readonly statusHistoryService: StatusHistoryService,
    private readonly time: TimeService,
    private readonly snackbar: MatSnackBar,
  ) {}

  get f() {
    return this.statusHistoryForm.controls;
  }

  ngOnInit() {
    this.createFormGroup();
    this.getTerritoryList();
    this.updateStatus();
    Object.keys(CURRENT_STATUS_VERDICT).forEach(verdict =>
      this.currentStatus.push(CURRENT_STATUS_VERDICT[verdict]),
    );
    Object.keys(DELIVERY_STATUS).forEach(status =>
      this.deliveryStatus.push(DELIVERY_STATUS[status]),
    );
  }

  createFormGroup() {
    this.statusHistoryForm = new FormGroup({
      posting_time: new FormControl('', [Validators.required]),
      posting_date: new FormControl('', [Validators.required]),
      status_from: new FormControl('', [Validators.required]),
      transfer_branch: new FormControl('', [Validators.required]),
      current_status_verdict: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      delivery_status: new FormControl('', [Validators.required]),
    });
  }

  getTerritoryList() {
    this.territoryList = this.statusHistoryForm.controls.status_from.valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      switchMap(value => {
        return this.statusHistoryService.getTerritoryList(value);
      }),
      map(res => res.docs),
    );
  }

  branchOptionChanged(option) {}

  getBranchOption(option) {
    if (option) return option.name;
  }

  getCurrentStatus(option) {
    if (option) return option;
  }

  async selectedPostingDate($event) {
    this.posting_date = await this.time.getDateAndTime($event.value);
    this.statusHistoryForm.controls.posting_date.setValue(
      this.posting_date.date,
    );
    this.statusHistoryForm.controls.posting_time.setValue(
      await (await this.time.getDateAndTime(new Date())).time,
    );
  }

  addStatusHistory() {
    const statusHistoryDetails = {} as StatusHistoryDetails;
    statusHistoryDetails.uuid = this.warrantyObject.uuid;
    statusHistoryDetails.time = this.statusHistoryForm.controls.posting_time.value;
    statusHistoryDetails.posting_date = this.statusHistoryForm.controls.posting_date.value;
    statusHistoryDetails.status_from = this.statusHistoryForm.controls.status_from.value.name;
    statusHistoryDetails.transfer_branch = this.statusHistoryForm.controls.transfer_branch.value.name;
    statusHistoryDetails.verdict = this.statusHistoryForm.controls.current_status_verdict.value;
    statusHistoryDetails.description = this.statusHistoryForm.controls.description.value;
    statusHistoryDetails.delivery_status = this.statusHistoryForm.controls.delivery_status.value;
    this.statusHistoryService.addStatusHistory(statusHistoryDetails).subscribe({
      next: () => {
        this.resetWarrantyDetail(this.warrantyObject.uuid);
        this.setInitialFormValue();
      },
      error: ({ message }) => {
        if (!message) message = STATUS_HISTORY_ADD_FAILURE;
        this.snackbar.open(message, 'Close', {
          duration: DURATION,
        });
      },
    });
  }

  setInitialFormValue() {
    this.statusHistoryForm.reset();
    this.getTerritoryList();
  }

  resetWarrantyDetail(uuid: string) {
    this.statusHistoryService.getWarrantyDetail(uuid).subscribe({
      next: res => {
        this.warrantyObject = res;
        this.updateStatus();
      },
    });
  }

  removeRow() {
    this.statusHistoryService
      .removeStatusHistory(this.warrantyObject.uuid)
      .subscribe({
        next: () => {
          this.resetWarrantyDetail(this.warrantyObject.uuid);
          this.updateStatus();
        },
        error: ({ message }) => {
          if (!message) message = STATUS_HISTORY_REMOVE_FAILURE;
          this.snackbar.open(message, 'Close', {
            duration: DURATION,
          });
        },
      });
  }

  updateStatus() {
    this.status = this.warrantyObject?.status_history
      .slice(-1)
      .pop().delivery_status;
  }
}
