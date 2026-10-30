import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxSelectDivider } from './divider.component';

@Component({
  template: `<cngx-select-divider />`,
  imports: [CngxSelectDivider],
})
class Host {}

describe('CngxSelectDivider', () => {
  it('stays out of the accessibility tree and renders no content', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const divider = (fixture.nativeElement as HTMLElement).querySelector('cngx-select-divider')!;
    expect(divider.getAttribute('role')).toBe('presentation');
    expect(divider.getAttribute('aria-hidden')).toBe('true');
    expect(divider.childElementCount).toBe(0);
    expect(divider.textContent).toBe('');
  });
});
