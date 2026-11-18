/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The listbox skin is
// loaded after `select-base.css`, the adverse order a lazy global stylesheet or
// a micro-frontend shell produces. The skin sits in the nested
// `cngx.components.skin` layer, so the select row rules (directly in
// `cngx.components`) still win; the skin keeps painting where the select does
// not, here the listbox padding.

@Component({
  selector: 'cngx-select-skin-order-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    './select-base.css',
    '../../../common/theming/components/cngx-listbox.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div cngxListbox role="listbox" class="listbox">
      <div
        cngxOption
        role="option"
        class="cngx-select__option row"
        style="--cngx-select-option-min-height: 48px"
      >
        Red
      </div>
      <div cngxOption role="option" class="cngx-select__option cngx-select__option--pending pending">
        Green
      </div>
    </div>
  `,
})
class SelectSkinOrderHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SelectSkinOrderHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select row vs the listbox skin loaded last', () => {
  it('keeps the select row radius', () => {
    const root = mount();
    expect(computedValue(query(root, '.row'), 'border-top-left-radius')).toBe('2px');
  });

  it('keeps the select row min-height token', () => {
    const root = mount();
    expect(computedValue(query(root, '.row'), 'min-height')).toBe('48px');
  });

  it('keeps the pending cursor', () => {
    const root = mount();
    expect(computedValue(query(root, '.pending'), 'cursor')).toBe('progress');
  });

  it('still paints the listbox padding the select does not own', () => {
    const root = mount();
    expect(computedValue(query(root, '.listbox'), 'padding-top')).toBe('4px');
  });
});
