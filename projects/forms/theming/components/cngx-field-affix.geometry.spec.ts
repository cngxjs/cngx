import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAffixRow } from '../../field/affix-row.directive';

// Runs in a real Chromium (the `test-geometry` target). This is Track-B CSS: it
// ships in the aggregated `cngx.css`, not on any component styleUrl, so the host
// below loads the exact file via `styleUrls` under `ViewEncapsulation.None` to
// exercise the real `@scope (.cngx-field-affix-row)` block. The row lays a
// prefix / control / suffix on one line: the control grows and may shrink past
// its intrinsic width (min-inline-size:0) while the affixes hug their content.
// jsdom reports `''` for these reads.

@Component({
  selector: 'cngx-field-affix-geometry-host',
  standalone: true,
  imports: [CngxAffixRow],
  styleUrls: ['./cngx-field-affix.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div cngxAffixRow>
      <span class="cngx-field-prefix">$</span>
      <input type="text" />
      <span class="cngx-field-suffix">kg</span>
    </div>
  `,
})
class AffixHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AffixHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const row = mountedRoot.querySelector('.cngx-field-affix-row');
  if (!row) {
    throw new Error('affix row did not render');
  }
  return row as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxAffixRow geometry', () => {
  it('lays the affixes and control on one flex line', () => {
    const row = mount();
    expect(computedValue(row, 'display')).toBe('inline-flex');
    expect(computedValue(row, 'align-items')).toBe('center');
  });

  it('grows the control and pins the affixes intrinsic', () => {
    const row = mount();
    const input = query(row, 'input');
    expect(computedValue(input, 'flex-grow')).toBe('1');
    expect(computedValue(input, 'min-inline-size')).toBe('0px');
    expect(computedValue(query(row, '.cngx-field-prefix'), 'flex-grow')).toBe('0');
  });
});
