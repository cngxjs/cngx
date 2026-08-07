import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxActionSelect } from './action-select.component';
import type { CngxSelectOptionDef } from '../shared/option.model';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-action-select)` block puts the positioned anchor on the `__root`
// wrapper (not the host) so the popover panel resolves against it, and the
// trigger is a flex row keeping the caret intrinsic beside the label. jsdom
// reports `''`.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-action-select-geometry-host',
  standalone: true,
  imports: [CngxActionSelect],
  template: `<cngx-action-select [label]="'Colour'" [options]="options" [(value)]="value" />`,
})
class Host {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(Host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-action-select');
  if (!host) {
    throw new Error('cngx-action-select did not render');
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

describe('CngxActionSelect geometry', () => {
  it('anchors the panel on the positioned __root wrapper', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-action-select__root'), 'position')).toBe('relative');
  });

  it('lays the trigger out as a flex row with the caret pinned intrinsic', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-action-select__trigger'), 'display')).toMatch(/flex$/);
    expect(computedValue(query(host, '.cngx-action-select__caret'), 'flex-grow')).toBe('0');
  });
});
