import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateFeesComponent } from './update-fees.component';

describe('UpdateFeesComponent', () => {
  let component: UpdateFeesComponent;
  let fixture: ComponentFixture<UpdateFeesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateFeesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
