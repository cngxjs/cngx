import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxChip } from './chip.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-chip)` block (chip.component.css:415) lays the prefix / label /
// remove button on one inline-flex line, derives the inner gap from the
// `--cngx-space-*` scale, and - only for an interactive (removable /
// selectable) chip - floors the hit box on both axes off `--cngx-target-min`.
// jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxChip],
  template: `<cngx-chip [removable]="true">Label</cngx-chip>`,
})
class ChipHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ChipHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-chip');
  if (!host) {
    throw new Error('cngx-chip did not render');
  }
  return host as HTMLElement;
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

describe('CngxChip geometry', () => {
  it('lays the pill contents on one inline-flex line with a scale-derived gap', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'align-items')).toBe('center');
    // :scope SETs --cngx-chip-inner-gap from var(--cngx-space-xs); driving the
    // scale token compacts the internal slots.
    host.style.setProperty('--cngx-space-xs', '5px');
    expect(computedValue(host, 'gap')).toBe('5px');
  });

  it('floors the interactive (removable) hit box on both axes', () => {
    const host = mount();
    // The `:has(.cngx-chip__remove)` branch turns the chip into a tap target,
    // so the pointer floor lifts both min sizes off --cngx-target-min. Inert
    // at 0px otherwise.
    host.style.setProperty('--cngx-target-min', '48px');
    expect(computedValue(host, 'min-block-size')).toBe('48px');
    expect(computedValue(host, 'min-inline-size')).toBe('48px');
    expect(computedValue(host, 'justify-content')).toBe('center');
  });

  it('floors the nested remove button as a centred tap target', () => {
    const host = mount();
    const remove = query(host, '.cngx-chip__remove');
    // Authored inline-flex; as a flex item of the chip it blockifies to flex.
    expect(computedValue(remove, 'display')).toMatch(/flex/);
    expect(computedValue(remove, 'justify-content')).toBe('center');
    host.style.setProperty('--cngx-target-min', '40px');
    expect(computedValue(remove, 'min-inline-size')).toBe('40px');
    expect(computedValue(remove, 'min-block-size')).toBe('40px');
  });
});
