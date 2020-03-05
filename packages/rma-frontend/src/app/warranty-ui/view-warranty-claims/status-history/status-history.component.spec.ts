import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StatusHistoryComponent } from './status-history.component';

describe('StatusHistoryComponent', () => {
  let component: StatusHistoryComponent;
  let fixture: ComponentFixture<StatusHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StatusHistoryComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
