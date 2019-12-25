import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSalesInvoicePage } from './add-sales-invoice.page';

describe('AddSalesInvoicePage', () => {
  let component: AddSalesInvoicePage;
  let fixture: ComponentFixture<AddSalesInvoicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSalesInvoicePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
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
