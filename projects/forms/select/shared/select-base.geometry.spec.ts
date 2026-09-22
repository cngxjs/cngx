import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxSelect } from '../single-select/select.component';
import type { CngxSelectOptionDef } from './option.model';

// Runs in a real Chromium (the `test-geometry` target). Covers the resting
// half of the field-skin blocks every variant stylesheet carries: the trigger
// - not the component host - is the box, and a trigger nested inside a skinned
// affix row keeps its full outline border so the row alone draws the surface.
// Two variants stand in for the two trigger shapes (single row and chip
// strip); the remaining seven reuse the same CSS paths.
//
// Focus-state rules are NOT asserted here. The headless page has no document
// focus, so `:focus-visible` / `:focus-within` never match even when
// `document.activeElement` is the trigger - an assertion on them would either
// fail or pass vacuously. `select-base.css.spec.ts` guards those rules as
// source text across all nine stylesheets instead.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-select-skin-geometry-host',
  standalone: true,
  imports: [CngxSelect, CngxMultiSelect],
  template: `
    <cngx-select class="solo" skin="fill" [label]="'Colour'" [options]="options" />
    <cngx-multi-select class="chips" skin="fill" [label]="'Colours'" [options]="options" />
    <span class="cngx-field-affix-row row" data-skin="fill">
      <cngx-select class="nested" skin="fill" [label]="'Currency'" [options]="options" />
    </span>
  `,
  styleUrls: ['../../theming/components/cngx-field-skin.css'],
})
class SkinHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SkinHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function trigger(root: HTMLElement, hostSelector: string): HTMLElement {
  const el = root.querySelector(`${hostSelector} [class$="__trigger"]`);
  if (!el) {
    throw new Error(`${hostSelector} trigger did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select-family field skins', () => {
  it('draws the fill trigger as an underline, not a box', () => {
    const el = trigger(mount(), '.solo');
    expect(computedValue(el, 'border-bottom-width')).toBe('1px');
    expect(computedValue(el, 'border-top-width')).toBe('0px');
  });

  it('applies the same treatment to a chip-strip trigger', () => {
    const el = trigger(mount(), '.chips');
    expect(computedValue(el, 'border-bottom-width')).toBe('1px');
    expect(computedValue(el, 'border-top-width')).toBe('0px');
  });

  it('keeps a trigger nested in a skinned affix row on its outline chrome', () => {
    const root = mount();
    const nested = trigger(root, '.nested');
    const row = root.querySelector('.row') as HTMLElement;
    // The `:not(.cngx-field-affix-row[data-skin] > *)` guard excludes the
    // nested host, so its trigger keeps all four borders while the row is the
    // only element carrying the underline.
    expect(computedValue(nested, 'border-top-width')).not.toBe('0px');
    expect(computedValue(row, 'border-bottom-width')).toBe('1px');
    expect(computedValue(row, 'border-top-width')).toBe('0px');
  });
});
