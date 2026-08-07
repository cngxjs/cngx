import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSelect } from './select.component';
import type { CngxSelectOptionDef } from '../shared/option.model';

// Runs in a real Chromium (the `test-geometry` target). The closed-trigger
// layout the `@scope (.cngx-select)` block SETs (select.component.css:165):
// the scope root is the positioned anchor the popover panel resolves against,
// and the trigger is a horizontal flex row that pins the caret to the far edge
// while the label absorbs the free space and the tap target holds a floored
// height. jsdom reports `''` for every one of these reads.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-select-geometry-host',
  standalone: true,
  imports: [CngxSelect],
  template: `<cngx-select [label]="'Colour'" [options]="options" [(value)]="value" />`,
})
class SelectHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SelectHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-select');
  if (!host) {
    throw new Error('cngx-select did not render');
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

describe('CngxSelect geometry', () => {
  it('anchors the panel on a positioned scope root', () => {
    const host = mount();
    expect(computedValue(host, 'position')).toBe('relative');
  });

  it('lays the trigger out as a space-between flex row', () => {
    const host = mount();
    const trigger = query(host, '.cngx-select__trigger');
    expect(computedValue(trigger, 'display')).toBe('inline-flex');
    expect(computedValue(trigger, 'justify-content')).toBe('space-between');
    // Label absorbs the free space; the caret stays intrinsic-width.
    expect(computedValue(query(host, '.cngx-select__label'), 'flex-grow')).toBe('1');
    expect(computedValue(query(host, '.cngx-select__caret'), 'flex-grow')).toBe('0');
  });

  it('floors the trigger height to the pointer-derived minimum', () => {
    const host = mount();
    const trigger = query(host, '.cngx-select__trigger');
    // min-height is max(base, --cngx-target-min): inert at 0, lifts when the
    // pointer floor exceeds the intrinsic 2.25rem base.
    host.style.setProperty('--cngx-target-min', '64px');
    expect(computedValue(trigger, 'min-height')).toBe('64px');
  });
});
