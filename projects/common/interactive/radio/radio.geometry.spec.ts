import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, rasterise } from '@cngx/testing/geometry';
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

@Component({
  standalone: true,
  imports: [CngxRadioGroup, CngxRadio],
  template: `
    <cngx-radio-group class="default">
      <cngx-radio [value]="'a'">A</cngx-radio>
    </cngx-radio-group>
    <div style="--cngx-color-primary: oklch(0.55 0.15 250)">
      <cngx-radio-group class="branded">
        <cngx-radio [value]="'a'">A</cngx-radio>
      </cngx-radio-group>
    </div>
  `,
})
class PrimaryRadioHost {}

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

// The focus ring falls back to the primary at the use site; a registered
// initial-value would shadow that fallback and paint Ember under any brand.
describe('CngxRadio focus ring', () => {
  it('paints the focus ring with the primary in scope', () => {
    const fixture = TestBed.createComponent(PrimaryRadioHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const ring = (scope: string): string => {
      const radio = (mountedRoot as HTMLElement).querySelector<HTMLElement>(
        `.${scope} .cngx-radio`,
      );
      if (!radio) {
        throw new Error(`${scope} radio did not render`);
      }
      radio.focus();
      return computedValue(radio, 'outline-color');
    };
    expect(rasterise(ring('branded'))).toEqual(rasterise('oklch(0.55 0.15 250)'));
    expect(rasterise(ring('default'))).toEqual(rasterise('oklch(0.66 0.19 50)'));
  });
});
