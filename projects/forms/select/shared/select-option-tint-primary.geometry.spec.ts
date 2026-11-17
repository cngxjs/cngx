/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The select cursor tint
// and the tree-node hover tint are mixes of `--cngx-color-primary`, assigned on
// `:root` and the scheme islands, so a re-themed root primary moves them and a
// dark island mixes its own primary at the dark alphas. The keyboard-active
// row's bar paints the strong primary of its scheme.

const BLUE = 'oklch(0.55 0.15 250)';
const EMBER = 'oklch(0.66 0.19 50)';

const mix = (primary: string, percent: number): string =>
  `color-mix(in oklch, ${primary} ${percent}%, transparent)`;

@Component({
  selector: 'cngx-select-option-tint-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    '../../../common/theming/components/cngx-listbox.css',
    './select-base.css',
    '../tree-select/tree-select-panel.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="scheme-light">
      <div role="listbox">
        <div class="cngx-select__option cngx-option--highlighted row">Red</div>
      </div>
    </div>
    <div class="scheme-dark" data-color-scheme="dark">
      <div role="listbox">
        <div class="cngx-select__option cngx-option--highlighted row">Red</div>
      </div>
    </div>
  `,
})
class SelectOptionTintHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SelectOptionTintHost);
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

const token = (el: Element, name: string): string => rasterise(computedValue(el, name)).join();

function barColour(row: Element): string {
  const shadow = computedValue(row, 'box-shadow');
  const colour = shadow.match(/(?:rgba?|oklch|oklab|color)\([^)]*\)/)?.[0];
  if (!colour) {
    throw new Error(`no bar colour in "${shadow}"`);
  }
  return rasterise(colour).join();
}

describe('select option tints follow the primary colour', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--cngx-color-primary');
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('a re-themed root primary moves the cursor and tree-hover tints', () => {
    document.documentElement.style.setProperty('--cngx-color-primary', BLUE);
    const row = one(mount(), '.scheme-light .row');
    expect(token(row, '--cngx-select-option-highlight-bg')).toBe(rasterise(mix(BLUE, 10)).join());
    expect(token(row, '--cngx-tree-select-node-hover-bg')).toBe(rasterise(mix(BLUE, 10)).join());
    expect(rasterise(computedValue(row, 'background-color')).join()).toBe(
      rasterise(mix(BLUE, 10)).join(),
    );
    expect(token(row, '--cngx-select-option-highlight-bg')).not.toBe(
      rasterise(mix(EMBER, 10)).join(),
    );
  });

  it('a dark island mixes its own primary at the dark alphas', () => {
    document.documentElement.style.setProperty('--cngx-color-primary', BLUE);
    const root = mount();
    const island = one(root, '.scheme-dark');
    const row = one(island, '.row');
    const darkPrimary = computedValue(island, '--cngx-color-primary');
    expect(rasterise(darkPrimary).join()).not.toBe(rasterise(BLUE).join());
    expect(token(row, '--cngx-select-option-highlight-bg')).toBe(
      rasterise(mix(darkPrimary, 18)).join(),
    );
    expect(token(row, '--cngx-tree-select-node-hover-bg')).toBe(
      rasterise(mix(darkPrimary, 16)).join(),
    );
  });

  it('draws the active bar in the strong primary of each scheme', () => {
    const root = mount();
    for (const scheme of ['.scheme-light', '.scheme-dark']) {
      const row = one(root, `${scheme} .row`);
      expect(barColour(row)).toBe(token(row, '--cngx-color-primary-strong'));
    }
    const light = one(root, '.scheme-light .row');
    expect(barColour(light)).not.toBe(token(light, '--cngx-color-primary'));
  });
});
