import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTypeahead } from './typeahead.component';
import type { CngxSelectOptionDef } from '../shared/option.model';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-typeahead)` block puts the positioned anchor on the `__root` wrapper
// (not the host) so the popover panel resolves against it, and the trigger is a
// flex row keeping the caret intrinsic beside the input. jsdom reports `''`.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-typeahead-geometry-host',
  standalone: true,
  imports: [CngxTypeahead],
  template: `<cngx-typeahead [label]="'Colour'" [options]="options" [(value)]="value" />`,
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
  const host = mountedRoot.querySelector('.cngx-typeahead');
  if (!host) {
    throw new Error('cngx-typeahead did not render');
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

describe('CngxTypeahead geometry', () => {
  it('anchors the panel on the positioned __root wrapper', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-typeahead__root'), 'position')).toBe('relative');
  });

  it('lays the trigger out as a flex row with the caret pinned intrinsic', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-typeahead__trigger'), 'display')).toMatch(/flex$/);
    expect(computedValue(query(host, '.cngx-typeahead__caret'), 'flex-grow')).toBe('0');
  });
});
