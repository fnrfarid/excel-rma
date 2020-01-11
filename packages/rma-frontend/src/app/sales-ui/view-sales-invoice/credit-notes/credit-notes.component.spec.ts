import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditNotesComponent } from './credit-notes.component';
import { MaterialModule } from '../../../material/material.module';
import { WarrantyService } from '../../../warranty-ui/warranty-tabs/warranty.service';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

describe('CreditNotesComponent', () => {
  let component: CreditNotesComponent;
  let fixture: ComponentFixture<CreditNotesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreditNotesComponent],
      imports: [MaterialModule, FormsModule, BrowserAnimationsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: WarrantyService,
          useValue: {
            findModels: (...args) => of({}),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
