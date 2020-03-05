import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StockEntryComponent } from './stock-entry.component';

describe('StockEntryComponent', () => {
  let component: StockEntryComponent;
  let fixture: ComponentFixture<StockEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StockEntryComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(StockEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
