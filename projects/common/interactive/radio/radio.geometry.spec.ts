import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxRadio } from './radio.component';
import { CngxRadioGroup } from './radio-group.component';

// Runs in a real Chromium (the `test-geometry` target). Two co-located
// `@scope` stylesheets:
//
//   1. `.cngx-radio-group` (radio-group.component.css:35) - an inline-flex
//      column with a scale-derived gap; `--horizontal` flips the axis to a
//      row. `vertical-align: top` anchors the host so it does not shift when
//      a leaf's indicator paints its dot.
//   2. `.cngx-radio` (radio.component.css:103) - the indicator + label on one
//      inline-flex line, floored to the pointer-derived hit-area minimum.
//
// A radio requires a parent group (it injects CNGX_RADIO_GROUP), so both are
// exercised from one host. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxRadioGroup, CngxRadio],
  template: `
    <cngx-radio-group [orientation]="orientation">
      <cngx-radio [value]="'a'">A</cngx-radio>
      <cngx-radio [value]="'b'">B</cngx-radio>
    </cngx-radio-group>
  `,
})
class RadioHost {
  orientation: 'horizontal' | 'vertical' = 'vertical';
}

function mount(orientation: 'horizontal' | 'vertical' = 'vertical'): {
  group: HTMLElement;
  radio: HTMLElement;
} {
  const fixture = TestBed.createComponent(RadioHost);
  fixture.componentInstance.orientation = orientation;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const group = mountedRoot.querySelector('.cngx-radio-group') as HTMLElement | null;
  const radio = mountedRoot.querySelector('.cngx-radio') as HTMLElement | null;
  if (!group || !radio) {
    throw new Error('cngx-radio-group / cngx-radio did not render');
  }
  return { group, radio };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxRadioGroup geometry', () => {
  it('stacks radios in a column with a scale-derived gap', () => {
    const { group } = mount('vertical');
    expect(computedValue(group, 'display')).toBe('inline-flex');
    expect(computedValue(group, 'flex-direction')).toBe('column');
    group.style.setProperty('--cngx-space-sm', '12px');
    expect(computedValue(group, 'gap')).toBe('12px');
  });

  it('flips to a row in the horizontal variant', () => {
    const { group } = mount('horizontal');
    expect(computedValue(group, 'flex-direction')).toBe('row');
  });
});

describe('CngxRadio geometry', () => {
  it('lays the indicator and label on one flex line', () => {
    const { radio } = mount('vertical');
    // Authored inline-flex; as a flex item of the group it blockifies to flex.
    expect(computedValue(radio, 'display')).toMatch(/flex/);
    expect(computedValue(radio, 'align-items')).toBe('center');
  });

  it('floors the interactive row on both axes', () => {
    const { radio } = mount('vertical');
    radio.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(radio, 'min-block-size')).toBe('44px');
    expect(computedValue(radio, 'min-inline-size')).toBe('44px');
  });
});
