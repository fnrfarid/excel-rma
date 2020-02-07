import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CreditLimitPage } from './credit-limit.page';
import { MaterialModule } from '../material/material.module';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SalesService } from '../sales-ui/services/sales.service';
import { Location } from '@angular/common';
import { of } from 'rxjs';

describe('CreditLimitPage', () => {
  let component: CreditLimitPage;
  let fixture: ComponentFixture<CreditLimitPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreditLimitPage],
      imports: [
        IonicModule.forRoot(),
        MaterialModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: SalesService,
          useValue: {
            getCustomerList: (...args) => of([{ credit_limits: [{}] }]),
            getStore: () => ({
              getItem: (...args) => Promise.resolve('Item'),
              getItems: (...args) => Promise.resolve({}),
            }),
          },
        },
        { provide: Location, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditLimitPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
