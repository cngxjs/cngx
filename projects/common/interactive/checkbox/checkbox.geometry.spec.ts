import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCheckbox } from './checkbox.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-checkbox)` block (checkbox.component.css:94) lays the indicator +
// label on one inline-flex line, derives the gap from `--cngx-space-*`, and
// floors the row to the pointer-derived hit-area minimum. The adjacent-sibling
// margin lives OUTSIDE the scope (the `+` combinator cannot cross a scope-root
// boundary). jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxCheckbox],
  template: `
    <cngx-checkbox>First</cngx-checkbox>
    <cngx-checkbox>Second</cngx-checkbox>
  `,
})
class CheckboxHost {}

function mount(): HTMLElement[] {
  const fixture = TestBed.createComponent(CheckboxHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const boxes = Array.from(mountedRoot.querySelectorAll('.cngx-checkbox')) as HTMLElement[];
  if (boxes.length < 2) {
    throw new Error('cngx-checkbox did not render');
  }
  return boxes;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxCheckbox geometry', () => {
  it('lays the indicator and label on one inline-flex line', () => {
    const [box] = mount();
    expect(computedValue(box, 'display')).toBe('inline-flex');
    expect(computedValue(box, 'align-items')).toBe('center');
    // :scope SETs --cngx-checkbox-gap from var(--cngx-space-sm).
    box.style.setProperty('--cngx-space-sm', '10px');
    expect(computedValue(box, 'gap')).toBe('10px');
  });

  it('floors the interactive row on both axes', () => {
    const [box] = mount();
    box.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(box, 'min-block-size')).toBe('44px');
    expect(computedValue(box, 'min-inline-size')).toBe('44px');
  });

  it('spaces adjacent inline checkboxes via the out-of-scope sibling rule', () => {
    const [first, second] = mount();
    // `.cngx-checkbox + .cngx-checkbox` sits outside @scope; drive its token
    // and read the resolved start margin on the second sibling.
    first.style.setProperty('--cngx-checkbox-sibling-gap', '24px');
    second.style.setProperty('--cngx-checkbox-sibling-gap', '24px');
    expect(computedValue(second, 'margin-inline-start')).toBe('24px');
  });
});
