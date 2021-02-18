import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddWarrantyClaimPage } from './add-warranty-claim.page';
import { TimeService } from '../../api/time/time.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddWarrantyService } from './add-warranty.service';
import { empty, of } from 'rxjs';
import { StorageService } from '../../api/storage/storage.service';
import { switchMap } from 'rxjs/operators';

describe('AddWarrantyClaimPage', () => {
  let component: AddWarrantyClaimPage;
  let fixture: ComponentFixture<AddWarrantyClaimPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddWarrantyClaimPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        MaterialModule,
        HttpClientTestingModule,
        FormsModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
        {
          provide: TimeService,
          useValue: {
            getDateAndTime: (...args) => Promise.resolve({}),
          },
        },
        {
          provide: AddWarrantyService,
          useValue: {
            getProblemList: (...args) => of([{}]),
            createWarrantyClaim: (...args) => of({}),
            updateWarrantyClaim: (...args) => of({}),
            getCustomerList: (...args) => switchMap(res => empty()),
            getItemList: (...args) => switchMap(res => empty()),
            getItem: (...args) => switchMap(res => empty()),
            getSerial: (...args) => of({}),
            getTerritoryByWarehouse: (...args) => of({}),
            getStorage: () => ({
              getItem: (...args) => Promise.resolve('Item'),
              getItems: (...args) => Promise.resolve({}),
            }),
          },
        },
        {
          provide: StorageService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddWarrantyClaimPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
