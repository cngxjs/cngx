/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxCheckboxIndicator } from '@cngx/common/display';
import { computedValue, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The bare checkmark of a
// selected single-value row paints `--cngx-select-check-color`, which follows
// the primary. The indicator's own scoped host colour beats `.cngx-select__check`,
// so the select feeds the indicator token instead. The boxed multi-value
// indicator keeps its own chain: the box fill follows the primary and the
// unchecked border stays in the row colour.

const BLUE = 'oklch(0.55 0.15 250)';
const GREEN = 'rgb(0 128 0)';

@Component({
  selector: 'cngx-select-check-colour-host',
  standalone: true,
  imports: [CngxCheckboxIndicator],
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    '../../../common/theming/components/cngx-listbox.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="listbox">
      <div class="cngx-select__option cngx-option--selected mark-row">
        <cngx-checkbox-indicator class="cngx-select__check" variant="checkmark" [checked]="true" />
        Red
      </div>
      <div class="cngx-select__option cngx-option--selected box-row">
        <cngx-checkbox-indicator class="cngx-select__check" variant="checkbox" [checked]="true" />
        Green
      </div>
      <div class="cngx-select__option empty-row">
        <cngx-checkbox-indicator class="cngx-select__check" variant="checkbox" [checked]="false" />
        Blue
      </div>
    </div>
  `,
})
class SelectCheckColourHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SelectCheckColourHost);
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

const paint = (el: Element, property: string): string =>
  rasterise(computedValue(el, property)).join();

describe('select check glyph colour', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--cngx-color-primary');
    document.documentElement.style.removeProperty('--cngx-select-check-color');
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('paints the bare checkmark in a re-themed root primary', () => {
    document.documentElement.style.setProperty('--cngx-color-primary', BLUE);
    const glyph = one(mount(), '.mark-row .cngx-checkbox-indicator__check');
    expect(paint(glyph, 'color')).toBe(rasterise(BLUE).join());
  });

  it('paints the bare checkmark in --cngx-select-check-color', () => {
    document.documentElement.style.setProperty('--cngx-select-check-color', GREEN);
    const glyph = one(mount(), '.mark-row .cngx-checkbox-indicator__check');
    expect(paint(glyph, 'color')).toBe(rasterise(GREEN).join());
  });

  it('leaves the boxed indicator on its own chain', () => {
    document.documentElement.style.setProperty('--cngx-color-primary', BLUE);
    document.documentElement.style.setProperty('--cngx-select-check-color', GREEN);
    const root = mount();
    const filled = one(root, '.box-row .cngx-checkbox-indicator__box');
    expect(paint(filled, 'background-color')).toBe(rasterise(BLUE).join());
    const emptyRow = one(root, '.empty-row');
    const empty = one(emptyRow, '.cngx-checkbox-indicator__box');
    expect(paint(empty, 'border-top-color')).toBe(paint(emptyRow, 'color'));
  });
});
