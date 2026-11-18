/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The listbox skin is
// loaded after `paginator-base.css`, the adverse order a lazy global stylesheet
// or a micro-frontend shell produces. The skin sits in the nested
// `cngx.components.skin` layer, so the paginator rows keep their own metrics,
// and the overflow grid hides the listbox ring through the skin's own
// `--cngx-listbox-focus-outline-width` hook (the highlighted cell is its focus
// indicator) while the page-size panel keeps the ring.

@Component({
  selector: 'cngx-paginator-skin-order-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    './styles/paginator-base.css',
    '../../theming/components/cngx-listbox.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul cngxListbox role="listbox" tabindex="0" class="cngx-paginator__select-panel select-panel">
      <li cngxOption role="option" class="cngx-paginator__option row">10</li>
    </ul>
    <ul
      cngxListbox
      role="listbox"
      tabindex="0"
      class="cngx-paginator__overflow-panel overflow-panel"
    >
      <li cngxOption role="option" class="cngx-paginator__option">4</li>
    </ul>
  `,
})
class PaginatorSkinOrderHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PaginatorSkinOrderHost);
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

describe('paginator vs the listbox skin loaded last', () => {
  it('keeps the option row floor', () => {
    const root = mount();
    expect(computedValue(query(root, '.row'), 'min-height')).toBe('32px');
  });

  it('keeps the option row inline padding', () => {
    const root = mount();
    expect(computedValue(query(root, '.row'), 'padding-left')).toBe('12px');
  });

  // Programmatic focus() matches :focus-visible in this runner.
  it('draws no ring around the focused overflow grid', () => {
    const panel = query(mount(), '.overflow-panel');
    panel.focus();
    expect(computedValue(panel, 'outline-width')).toBe('0px');
  });

  it('keeps the ring on the focused page-size panel', () => {
    const panel = query(mount(), '.select-panel');
    panel.focus();
    expect(computedValue(panel, 'outline-width')).toBe('2px');
  });
});
