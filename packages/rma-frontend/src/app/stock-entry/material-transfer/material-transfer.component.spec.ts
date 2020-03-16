import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { MaterialTransferComponent } from './material-transfer.component';
import { SalesService } from '../../sales-ui/services/sales.service';
import { MaterialModule } from '../../material/material.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { StockEntryService } from '../services/stock-entry/stock-entry.service';
import { TimeService } from '../../api/time/time.service';

describe('MaterialTransferComponent', () => {
  let component: MaterialTransferComponent;
  let fixture: ComponentFixture<MaterialTransferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MaterialTransferComponent],
      imports: [
        IonicModule.forRoot(),
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: SalesService,
          useValue: {
            getSalesInvoice: (...args) =>
              of({ items: [], delivered_items_map: {} }),
            getWarehouseList: (...args) => of([{}]),
            getStore: () => ({
              getItem: (...args) => Promise.resolve('ITEM'),
            }),
          },
        },
        {
          provide: TimeService,
          useValue: {},
        },
        {
          provide: StockEntryService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
