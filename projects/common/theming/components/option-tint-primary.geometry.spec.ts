/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The listbox cursor and
// selected tints are mixes of `--cngx-color-primary`, assigned on `:root`: a
// re-themed root primary moves both rows, the dark scheme lifts the alphas,
// the default theme paints the same Ember tint as the old literals, and row
// text keeps 4.5:1 on the selected tint.

const BLUE = 'oklch(0.55 0.15 250)';
const EMBER = 'oklch(0.66 0.19 50)';
const EMBER_DARK = 'oklch(0.72 0.18 50)';

const mix = (primary: string, percent: number): string =>
  `color-mix(in oklch, ${primary} ${percent}%, transparent)`;

@Component({
  selector: 'cngx-option-tint-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-listbox.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="surface" style="background: var(--cngx-color-surface); color: var(--cngx-color-text)">
      <div cngxListbox>
        <div cngxOption class="cngx-option--highlighted opt-cursor">Apple</div>
        <div cngxOption class="cngx-option--selected opt-selected">Banana</div>
      </div>
    </div>
  `,
})
class OptionTintHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(OptionTintHost);
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

const bg = (root: ParentNode, selector: string): string =>
  computedValue(one(root, selector), 'background-color');

// Composite a translucent fill over the surface the way it renders.
function paint(...layers: string[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no 2d context');
  }
  for (const layer of layers) {
    ctx.fillStyle = layer;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return `rgb(${r}, ${g}, ${b})`;
}

function textOnSelected(root: ParentNode): number {
  const surface = bg(root, '.surface');
  const text = computedValue(one(root, '.opt-selected'), 'color');
  return contrastRatio(text, paint(surface, bg(root, '.opt-selected')));
}

describe('listbox option tints follow the primary colour', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--cngx-color-primary');
    document.documentElement.removeAttribute('data-color-scheme');
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('default light theme paints the Ember tints at 10% and 18%', () => {
    const root = mount();
    expect(rasterise(bg(root, '.opt-cursor'))).toEqual(rasterise(`oklch(0.66 0.19 50 / 0.1)`));
    expect(rasterise(bg(root, '.opt-selected'))).toEqual(rasterise(`oklch(0.66 0.19 50 / 0.18)`));
  });

  it('default dark theme paints the dark Ember tints at 18% and 28%', () => {
    document.documentElement.setAttribute('data-color-scheme', 'dark');
    const root = mount();
    expect(rasterise(bg(root, '.opt-cursor'))).toEqual(rasterise(mix(EMBER_DARK, 18)));
    expect(rasterise(bg(root, '.opt-selected'))).toEqual(rasterise(mix(EMBER_DARK, 28)));
  });

  it('a re-themed root primary moves the cursor and selected tints', () => {
    document.documentElement.style.setProperty('--cngx-color-primary', BLUE);
    const root = mount();
    expect(rasterise(bg(root, '.opt-cursor'))).toEqual(rasterise(mix(BLUE, 10)));
    expect(rasterise(bg(root, '.opt-selected'))).toEqual(rasterise(mix(BLUE, 18)));
    expect(rasterise(bg(root, '.opt-cursor'))).not.toEqual(rasterise(mix(EMBER, 10)));
  });

  it('a re-themed root primary keeps the dark alphas', () => {
    document.documentElement.setAttribute('data-color-scheme', 'dark');
    document.documentElement.style.setProperty('--cngx-color-primary', BLUE);
    const root = mount();
    expect(rasterise(bg(root, '.opt-cursor'))).toEqual(rasterise(mix(BLUE, 18)));
    expect(rasterise(bg(root, '.opt-selected'))).toEqual(rasterise(mix(BLUE, 28)));
  });

  it('row text clears 4.5:1 on the selected tint in both schemes', () => {
    const light = mount();
    expect(textOnSelected(light)).toBeGreaterThanOrEqual(4.5);
    mountedRoot?.remove();
    document.documentElement.setAttribute('data-color-scheme', 'dark');
    const dark = mount();
    expect(textOnSelected(dark)).toBeGreaterThanOrEqual(4.5);
  });
});
