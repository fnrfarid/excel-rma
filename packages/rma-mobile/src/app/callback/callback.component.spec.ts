import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallbackComponent } from './callback.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StorageService } from '../api/storage.service';

@Component({
  selector: 'app-mock',
  template: '',
})
class MockComponent {}

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let storageServiceSpy;

  beforeEach(async(() => {
    storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'store',
      'clear',
    ]);
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          {
            path: 'home',
            component: MockComponent,
          },
        ]),
        HttpClientTestingModule,
      ],
      declarations: [MockComponent, CallbackComponent],
      providers: [{ provide: StorageService, useValue: storageServiceSpy }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
