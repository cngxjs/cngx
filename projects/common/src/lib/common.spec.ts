import { describe, it, expect, beforeEach } from 'vitest';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { CngxCommon } from './common';

describe('CngxCommon', () => {
  let component: CngxCommon;
  let fixture: ComponentFixture<CngxCommon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CngxCommon]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CngxCommon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
