import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddSalesReturnPage } from './add-sales-return.page';
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MaterialModule } from '../../material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Location } from '@angular/common';
import { SalesService } from '../services/sales.service';
import { of } from 'rxjs';

@Pipe({ name: 'curFormat' })
class MockPipe implements PipeTransform {
  transform(value: string) {
    return value;
  }
}

describe('AddSalesReturnPage', () => {
  let component: AddSalesReturnPage;
  let fixture: ComponentFixture<AddSalesReturnPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddSalesReturnPage, MockPipe],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        {
          provide: Location,
          useValue: {},
        },
        {
          provide: SalesService,
          useValue: {
            getSalesInvoice: (...args) => of({ delivery_note_items: [] }),
            getWarehouseList: (...args) => of([{}]),
            getStore: () => ({
              getItem: (...args) => Promise.resolve('ITEM'),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSalesReturnPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});