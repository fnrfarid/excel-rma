import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallbackPage } from './callback.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

@Component({
  template: '',
})
class MockComponent {}

describe('CallbackPage', () => {
  let component: CallbackPage;
  let fixture: ComponentFixture<CallbackPage>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CallbackPage, MockComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'home', component: MockComponent },
        ]),
        HttpClientTestingModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallbackPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
