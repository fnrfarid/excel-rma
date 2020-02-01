import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PurchaseAssignSerialsComponent } from './purchase-assign-serials.component';
import { MaterialModule } from '../../../material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material';
import { SalesService } from '../../../sales-ui/services/sales.service';
import { of } from 'rxjs';
import { PurchaseService } from '../../services/purchase.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PurchaseAssignSerialsComponent', () => {
  let component: PurchaseAssignSerialsComponent;
  let fixture: ComponentFixture<PurchaseAssignSerialsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PurchaseAssignSerialsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        IonicModule.forRoot(),
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        {
          provide: MatSnackBar,
          useValue: {},
        },
        {
          provide: SalesService,
          useValue: {
            getWarehouseList: (...args) => of([{}]),
            getStore: () => ({
              getItem: (...args) => Promise.resolve('ITEM'),
            }),
          },
        },
        {
          provide: PurchaseService,
          useValue: {
            getPurchaseInvoice: (...args) => of({ items: [] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseAssignSerialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
