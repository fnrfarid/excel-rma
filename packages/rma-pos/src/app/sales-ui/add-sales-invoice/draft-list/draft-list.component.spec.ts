import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DraftListComponent } from './draft-list.component';

describe('DraftListComponent', () => {
  let component: DraftListComponent;
  let fixture: ComponentFixture<DraftListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DraftListComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DraftListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
