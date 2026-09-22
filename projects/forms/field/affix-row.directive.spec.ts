import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxAffixRow } from './affix-row.directive';

@Component({
  template: `<span cngxAffixRow><input /></span>`,
  imports: [CngxAffixRow],
})
class Host {}

@Component({
  template: `<span cngxAffixRow skin="fill"><input /></span>`,
  imports: [CngxAffixRow],
})
class SkinHost {}

describe('CngxAffixRow', () => {
  it('carries the structural row class for the Track-B layout', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('[cngxAffixRow]') as HTMLElement;
    expect(row.classList.contains('cngx-field-affix-row')).toBe(true);
  });

  it('carries data-skin so the row, not the control, is the box', () => {
    const fixture = TestBed.createComponent(SkinHost);
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('[cngxAffixRow]') as HTMLElement;
    expect(row.getAttribute('data-skin')).toBe('fill');
  });
});
