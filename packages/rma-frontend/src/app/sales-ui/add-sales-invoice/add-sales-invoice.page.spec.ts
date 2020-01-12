import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSalesInvoicePage } from './add-sales-invoice.page';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from '../../material/material.module';
import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SalesInvoice } from 'src/app/common/interfaces/sales.interface';
import { of } from 'rxjs';

describe('AddSalesInvoicePage', () => {
  let component: AddSalesInvoicePage;
  let fixture: ComponentFixture<AddSalesInvoicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddSalesInvoicePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [RouterTestingModule, HttpClientTestingModule, MaterialModule],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
        {
          provide: SalesInvoice,
          useValue: {
            createSalesInvoice: (...args) => of({}),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSalesInvoicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
