import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StockEntryListPage } from './stock-entry-list.page';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MaterialModule } from '../../material/material.module';
import { Location } from '@angular/common';

import { of } from 'rxjs';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';

@Pipe({ name: 'curFormat' })
class MockCurrencyFormatPipe implements PipeTransform {
  transform(value: string) {
    return value;
  }
}

describe('PurchasePage', () => {
  let component: StockEntryListPage;
  let fixture: ComponentFixture<StockEntryListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StockEntryListPage, MockCurrencyFormatPipe],
      imports: [
        MaterialModule,
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
        {
          provide: StockEntryService,
          useValue: {
            getPurchaseInvoiceList: (...args) => of([{}]),
            getStore: () => ({
              getItem: (...args) => Promise.resolve('Item'),
              getItems: (...args) => Promise.resolve({}),
            }),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StockEntryListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
