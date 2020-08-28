import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { empty } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { SerialSearchPage } from './serial-search.page';
import { SerialSearchService } from './serial-search.service';
import { StorageService } from '../../api/storage/storage.service';
import { MaterialModule } from '../../material/material.module';

describe('SerialSearchPage', () => {
  let component: SerialSearchPage;
  let fixture: ComponentFixture<SerialSearchPage>;
  let serialSearchService: jasmine.SpyObj<SerialSearchService>;

  beforeEach(async(() => {
    serialSearchService = jasmine.createSpyObj([
      'getSerialsList',
      'relayDocTypeOperation',
    ]);
    serialSearchService.getSerialsList.and.returnValue(empty());
    serialSearchService.relayDocTypeOperation.and.returnValue(
      switchMap(() => empty()),
    );

    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule,
        MaterialModule,
        BrowserAnimationsModule,
      ],
      declarations: [SerialSearchPage],
      providers: [
        {
          provide: SerialSearchService,
          useValue: serialSearchService,
        },
        { provide: StorageService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SerialSearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
