/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The "More" overflow
// menu is a bare `[cngxPopover]` element (`.cngx-tab-overflow__panel`). It must
// paint its own surface - background, border, radius, padding, scroll cap - on
// that live element, and the global bare-popover UA reset must not strip it.
// The background follows the foundation surface, so it reads in both schemes.
// Schemes are pinned on the root element, where the app sets them.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-tab-overflow-panel-surface-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    '../../common/theming/components/cngx-popover.css',
    './tab-overflow.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <span class="probe-surface" style="background: var(--cngx-color-surface)"></span>
    <div class="cngx-tab-overflow">
      <div cngxPopover popover="manual" role="menu" class="cngx-tab-overflow__panel">
        <ul class="cngx-tab-overflow__list" role="presentation">
          <li role="menuitem" class="cngx-tab-overflow__item">Hidden tab</li>
        </ul>
      </div>
    </div>
    <div class="cngx-tab-overflow">
      <div
        cngxPopover
        popover="manual"
        role="menu"
        class="cngx-tab-overflow__panel panel-override"
        style="--cngx-tab-overflow-popover-bg: rgb(1, 2, 3)"
      ></div>
    </div>
  `,
})
class OverflowPanelHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(OverflowPanelHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('data-color-scheme');
});

describe.each(SCHEMES)('tab overflow panel surface, %s', (scheme) => {
  it('paints the scheme surface, a border, padding and a scroll cap', () => {
    document.documentElement.setAttribute('data-color-scheme', scheme);
    const root = mount();
    const panel = one(root, '.cngx-tab-overflow__panel');
    const surface = computedValue(one(root, '.probe-surface'), 'background-color');
    expect(computedValue(panel, 'background-color')).toBe(surface);
    expect(computedValue(panel, 'border-top-style')).toBe('solid');
    expect(computedValue(panel, 'border-top-width')).toBe('1px');
    expect(parseFloat(computedValue(panel, 'padding-top'))).toBeGreaterThan(0);
    expect(computedValue(panel, 'overflow-y')).toBe('auto');
    expect(computedValue(panel, 'min-width')).not.toBe('0px');
  });

  it('lets --cngx-tab-overflow-popover-bg override the surface', () => {
    document.documentElement.setAttribute('data-color-scheme', scheme);
    const root = mount();
    expect(computedValue(one(root, '.panel-override'), 'background-color')).toBe('rgb(1, 2, 3)');
  });
});
