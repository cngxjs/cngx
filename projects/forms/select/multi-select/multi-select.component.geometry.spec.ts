import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxMultiSelect } from './multi-select.component';
import type { CngxSelectOptionDef } from '../shared/option.model';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-multi-select)` root is the positioned anchor the popover panel resolves
// against, and the trigger is a flex row keeping the caret intrinsic beside the
// chip strip. jsdom reports `''` for these reads.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-multi-select-geometry-host',
  standalone: true,
  imports: [CngxMultiSelect],
  template: `<cngx-multi-select [label]="'Colour'" [options]="options" [(values)]="values" />`,
})
class Host {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(Host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-multi-select');
  if (!host) {
    throw new Error('cngx-multi-select did not render');
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
  document.documentElement.removeAttribute('dir');
});

describe('CngxMultiSelect geometry', () => {
  it('anchors the panel on a positioned scope root', () => {
    expect(computedValue(mount(), 'position')).toBe('relative');
  });

  it('lays the trigger out as a flex row with the caret pinned intrinsic', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-multi-select__trigger'), 'display')).toMatch(/flex$/);
    expect(computedValue(query(host, '.cngx-multi-select__caret'), 'flex-grow')).toBe('0');
  });
});

// ── RTL bidi isolation of the +N chip-overflow badge (select-base.css) ───────

@Component({
  selector: 'cngx-multi-select-overflow-host',
  standalone: true,
  imports: [CngxMultiSelect],
  template: `
    <cngx-multi-select
      [label]="'Colour'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    />
  `,
})
class OverflowHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green']);
}

describe('CngxMultiSelect chip-overflow badge isolates under dir=rtl', () => {
  it('pins the +N badge to isolate + direction:ltr', () => {
    document.documentElement.dir = 'rtl';
    const fixture = TestBed.createComponent(OverflowHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const badge = query(mountedRoot, '.cngx-select__chip-overflow-badge');
    // `+N` detaches its `+` under RTL; direction:ltr keeps sign left of digits.
    expect(computedValue(badge, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(badge, 'direction')).toBe('ltr');
  });
});
