import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CxCore } from './core';

describe('CxCore', () => {
  let component: CxCore;
  let fixture: ComponentFixture<CxCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CxCore],
    }).compileComponents();

    fixture = TestBed.createComponent(CxCore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
