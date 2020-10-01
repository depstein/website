import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PielabComponent } from './pielab.component';

describe('PielabComponent', () => {
  let component: PielabComponent;
  let fixture: ComponentFixture<PielabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PielabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PielabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
