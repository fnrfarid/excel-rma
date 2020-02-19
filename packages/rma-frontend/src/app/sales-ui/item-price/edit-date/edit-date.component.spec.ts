import { async, ComponentFixture, TestBed } from '@angular/core/testing';
// import { IonicModule } from '@ionic/angular';

import { EditDateComponent } from './edit-date.component';
import { MaterialModule } from 'src/app/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SatPopover } from '@ncstate/sat-popover';

// import { SatPopover } from '@ncstate/sat-popover';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('EditDateComponent', () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditDateComponent],
      // imports: [IonicModule.forRoot()]
      imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: SatPopover, useValue: {} }],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(EditDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
