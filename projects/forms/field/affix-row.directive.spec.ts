import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxAffixRow } from './affix-row.directive';

@Component({
  template: `<span cngxAffixRow><input /></span>`,
  imports: [CngxAffixRow],
})
class Host {}

describe('CngxAffixRow', () => {
  it('carries the structural row class for the Track-B layout', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('[cngxAffixRow]') as HTMLElement;
    expect(row.classList.contains('cngx-field-affix-row')).toBe(true);
  });
});
