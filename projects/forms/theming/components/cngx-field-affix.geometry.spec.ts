import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxIcon } from '@cngx/common/display';

import { CngxAffixRow } from '../../field/field-box.directive';

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
  imports: [CngxAffixRow, CngxIcon],
  styleUrls: ['./cngx-field-affix.css', '../../../common/display/icon/icon.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div cngxAffixRow>
      <span class="cngx-field-prefix">$</span>
      <input type="text" />
      <span class="cngx-field-suffix">kg</span>
    </div>
    <div cngxAffixRow class="patterns">
      <span class="cngx-field-prefix"><cngx-icon>search</cngx-icon></span>
      <input type="text" />
      <button type="button" class="cngx-field-suffix cngx-field-affix--interactive">x</button>
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

function mountPatterns(): HTMLElement {
  mount();
  const row = mountedRoot!.querySelector('.patterns');
  if (!row) {
    throw new Error('affix pattern row did not render');
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

  it('sizes the interactive affix to the box line instead of a standalone floor', () => {
    const row = mountPatterns();
    const button = query(row, '.cngx-field-affix--interactive');
    // Inside the box the floor is --cngx-target-min minus padding and border,
    // which is 0px on the fine pointer the headless run reports; the button
    // stretches to the line box and never pushes the box past its formula.
    expect(computedValue(button, 'min-height')).toBe('0px');
    expect(computedValue(button, 'align-self')).toBe('stretch');
    expect(computedValue(button, 'justify-content')).toBe('center');
  });

  it('drives the decorative glyph through the CngxIcon size and colour knobs', () => {
    const icon = query(mountPatterns(), 'cngx-icon');
    // The affix rule owns the assignment, not the geometry: CngxIcon reads
    // these two knobs on its own host, which is the element this rule
    // targets. Asserting the resolved gauge keeps the contract on the affix
    // side without re-testing the icon's internal cascade.
    expect(computedValue(icon, '--cngx-field-affix-icon-size')).toBe('1.25em');
    expect(computedValue(icon, '--cngx-icon-color')).not.toBe('');
  });
});
