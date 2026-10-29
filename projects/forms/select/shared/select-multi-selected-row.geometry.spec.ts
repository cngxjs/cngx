/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). In a multi-value
// panel the checkbox carries the selection, so a selected row that renders
// its indicator drops the listbox fill; the keyboard cursor still paints on
// it. Single-value rows and rows without an indicator keep the fill, since it
// is their only visual selection signal.

const SCHEMES = ['light', 'dark'] as const;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

@Component({
  selector: 'cngx-select-multi-selected-row-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    '../../../common/theming/components/cngx-listbox.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="listbox" aria-multiselectable="true">
      <div
        class="cngx-select__option cngx-select__option--indicated cngx-option--selected multi-selected"
      >
        Red
      </div>
      <div
        class="cngx-select__option cngx-select__option--indicated cngx-option--selected cngx-option--highlighted multi-cursor"
      >
        Green
      </div>
      <div class="cngx-select__option cngx-option--selected multi-no-indicator">Blue</div>
    </div>
    <div
      role="listbox"
      aria-multiselectable="true"
      style="--cngx-select-option-multi-selected-bg: rgb(10, 20, 30)"
    >
      <div
        class="cngx-select__option cngx-select__option--indicated cngx-option--selected multi-opt-in"
      >
        Red
      </div>
    </div>
    <div role="listbox">
      <div
        class="cngx-select__option cngx-select__option--indicated cngx-option--selected single-selected"
      >
        Red
      </div>
    </div>
    <span
      class="probe-highlight"
      style="background-color: var(--cngx-select-option-highlight-bg)"
    ></span>
    <span class="probe-selected" style="background-color: var(--cngx-option-selected-bg)"></span>
  `,
})
class MultiSelectedRowHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MultiSelectedRowHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function bg(root: ParentNode, selector: string): string {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return computedValue(el, 'background-color');
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('multi-value selected option row, %s', (scheme) => {
  async function mountIn(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
    return mount();
  }

  it('paints no fill on a selected row that renders its indicator', async () => {
    const root = await mountIn();
    expect(bg(root, '.multi-selected')).toBe(TRANSPARENT);
  });

  it('keeps the cursor fill on a selected row', async () => {
    const root = await mountIn();
    expect(bg(root, '.multi-cursor')).toBe(bg(root, '.probe-highlight'));
  });

  it('keeps the listbox fill when the indicator is hidden', async () => {
    const root = await mountIn();
    const selected = bg(root, '.probe-selected');
    expect(selected).not.toBe(TRANSPARENT);
    expect(bg(root, '.multi-no-indicator')).toBe(selected);
  });

  it('paints the opt-in token when a consumer assigns it', async () => {
    const root = await mountIn();
    expect(bg(root, '.multi-opt-in')).toBe('rgb(10, 20, 30)');
  });

  it('keeps the listbox fill on a single-value selected row', async () => {
    const root = await mountIn();
    expect(bg(root, '.single-selected')).toBe(bg(root, '.probe-selected'));
  });
});
