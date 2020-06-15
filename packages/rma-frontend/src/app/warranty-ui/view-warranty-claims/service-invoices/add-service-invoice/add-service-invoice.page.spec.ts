import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddServiceInvoicePage } from './add-service-invoice.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MaterialModule } from '../../../../material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TimeService } from '../../../../api/time/time.service';
import { Pipe, PipeTransform, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Pipe({ name: 'curFormat' })
class MockPipe implements PipeTransform {
  transform(value: string) {
    return value;
  }
}

describe('AddServiceInvoicePage', () => {
  let component: AddServiceInvoicePage;
  let fixture: ComponentFixture<AddServiceInvoicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddServiceInvoicePage, MockPipe],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        {
          provide: TimeService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddServiceInvoicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
