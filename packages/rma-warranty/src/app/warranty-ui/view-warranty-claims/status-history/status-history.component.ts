import { Component, OnInit, Input } from '@angular/core';
import {
  WarrantyClaimsDetails,
  StatusHistoryDetails,
  StockEntryItems,
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
  ERROR_FETCHING_DETAILS,
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
  territory: any = [];
  currentStatus: any = [];
  deliveryStatus: any = [];
  posting_date: { date: string; time: string };
  stockEntry: StockEntryItems;

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
    Object.keys(CURRENT_STATUS_VERDICT).forEach(verdict =>
      this.currentStatus.push(CURRENT_STATUS_VERDICT[verdict]),
    );
    Object.keys(DELIVERY_STATUS).forEach(status =>
      this.deliveryStatus.push(DELIVERY_STATUS[status]),
    );
    this.setStockEntryStatusFields();
  }

  createFormGroup() {
    this.statusHistoryForm = new FormGroup({
      posting_time: new FormControl('', [Validators.required]),
      posting_date: new FormControl('', [Validators.required]),
      status_from: new FormControl('', [Validators.required]),
      transfer_branch: new FormControl(''),
      current_status_verdict: new FormControl('', [Validators.required]),
      description: new FormControl(''),
      delivery_status: new FormControl(''),
    });
  }

  getTerritoryList() {
    this.territoryList = this.statusHistoryForm.controls.transfer_branch.valueChanges.pipe(
      debounceTime(500),
      startWith(''),
      switchMap(value => {
        return this.statusHistoryService.getTerritoryList(value);
      }),
      map(res => res.docs),
    );

    this.statusHistoryService
      .getStorage()
      .getItem('territory')
      .then(territory => {
        this.territory = territory;
        this.statusHistoryForm.controls.status_from.setValue(territory[0]);
      });
    this.selectedPostingDate({ value: new Date() });
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
    statusHistoryDetails.status_from = this.statusHistoryForm.controls.status_from.value;
    statusHistoryDetails.verdict = this.statusHistoryForm.controls.current_status_verdict.value;
    statusHistoryDetails.description = this.statusHistoryForm.controls.description.value;
    statusHistoryDetails.delivery_status = this.statusHistoryForm.controls.delivery_status.value;
    this.time.getDateAndTime(new Date()).then(dateTime => {
      statusHistoryDetails.date = dateTime.date;
    });
    this.statusHistoryService
      .getStorage()
      .getItem('territory')
      .then(territory => {
        statusHistoryDetails.delivery_branch = territory[0];
      });
    if (
      this.statusHistoryForm.controls.current_status_verdict.value ===
      CURRENT_STATUS_VERDICT.TRANSFERRED
    ) {
      statusHistoryDetails.transfer_branch = this.statusHistoryForm.controls.transfer_branch.value.name;
    }
    this.statusHistoryService.addStatusHistory(statusHistoryDetails).subscribe({
      next: () => {
        this.resetWarrantyDetail(this.warrantyObject.uuid);
        this.setInitialFormValue();
        this.setStockEntryStatusFields();
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
      },
    });
  }

  removeRow() {
    this.statusHistoryService
      .removeStatusHistory(this.warrantyObject.uuid)
      .subscribe({
        next: () => {
          this.resetWarrantyDetail(this.warrantyObject.uuid);
        },
        error: ({ message }) => {
          if (!message) message = STATUS_HISTORY_REMOVE_FAILURE;
          this.snackbar.open(message, 'Close', {
            duration: DURATION,
          });
        },
      });
  }

  setStockEntryStatusFields() {
    this.statusHistoryService
      .getStockEntry(this.warrantyObject?.uuid)
      .subscribe({
        next: (res: any) => {
          this.stockEntry = res;
        },
        error: ({ message }) => {
          if (!message) message = ERROR_FETCHING_DETAILS;
          this.snackbar.open(message, 'Close', {
            duration: DURATION,
          });
        },
      });
  }

  selectedCurrentStatus(option) {
    switch (option) {
      case CURRENT_STATUS_VERDICT.TRANSFERRED:
        this.statusHistoryForm.controls.transfer_branch.setValidators(
          Validators.required,
        );
        this.statusHistoryForm.controls.transfer_branch.updateValueAndValidity();
        break;
      default:
        this.statusHistoryForm.controls.transfer_branch.clearValidators();
        this.statusHistoryForm.controls.transfer_branch.updateValueAndValidity();
        break;
    }
  }
}
