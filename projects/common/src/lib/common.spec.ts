import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Common } from './common';

describe('Common', () => {
  let component: Common;
  let fixture: ComponentFixture<Common>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Common]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Common);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
