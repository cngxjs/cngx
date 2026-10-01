/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled checkbox or
// radio indicator fades by colour, never opacity: stroke, glyph and checked
// fill take the 38% text recipe of a disabled field, and under forced colors
// the indicator reads GrayText instead of collapsing to CanvasText.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-indicator-disabled-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './checkbox-indicator/checkbox-indicator.component.css',
    './radio-indicator/radio-indicator.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <span
          class="cngx-checkbox-indicator cngx-checkbox-indicator--md cngx-checkbox-indicator--checked cngx-checkbox-indicator--disabled cbi-checked"
        >
          <span class="cngx-checkbox-indicator__box">
            <span class="cngx-checkbox-indicator__check">✓</span>
          </span>
        </span>
        <span
          class="cngx-checkbox-indicator cngx-checkbox-indicator--md cngx-checkbox-indicator--disabled cbi-unchecked"
        >
          <span class="cngx-checkbox-indicator__box"></span>
        </span>
        <span
          class="cngx-checkbox-indicator cngx-checkbox-indicator--md cngx-checkbox-indicator--checked cbi-enabled"
        >
          <span class="cngx-checkbox-indicator__box">
            <span class="cngx-checkbox-indicator__check">✓</span>
          </span>
        </span>
        <span
          class="cngx-radio-indicator cngx-radio-indicator--md cngx-radio-indicator--checked cngx-radio-indicator--disabled rbi-checked"
        >
          <span class="cngx-radio-indicator__circle">
            <span class="cngx-radio-indicator__dot"></span>
          </span>
        </span>
        <span class="cngx-radio-indicator cngx-radio-indicator--md cngx-radio-indicator--disabled rbi-unchecked">
          <span class="cngx-radio-indicator__circle"></span>
        </span>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-highlighttext" style="color: HighlightText"></span>
    <span class="cngx-radio-indicator cngx-radio-indicator--md cngx-radio-indicator--checked plain-radio">
      <span class="cngx-radio-indicator__circle"><span class="cngx-radio-indicator__dot"></span></span>
    </span>
    <div class="opted-out" style="forced-color-adjust: none; background: Highlight; color: HighlightText">
      <span class="cngx-checkbox-indicator cngx-checkbox-indicator--md cngx-checkbox-indicator--checked">
        <span class="cngx-checkbox-indicator__box"><span class="cngx-checkbox-indicator__check">✓</span></span>
      </span>
      <span class="cngx-radio-indicator cngx-radio-indicator--md cngx-radio-indicator--checked">
        <span class="cngx-radio-indicator__circle"><span class="cngx-radio-indicator__dot"></span></span>
      </span>
    </div>
  `,
})
class IndicatorHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(IndicatorHost);
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

function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

async function forceColors(scheme: string): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: scheme },
    ],
  });
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled indicators, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);
  const disabledColour = (root: HTMLElement): string =>
    computedValue(at(root, '.probe-disabled'), 'color');

  it('keeps every disabled indicator at full opacity', () => {
    const root = mount();
    for (const sel of ['.cbi-checked', '.cbi-unchecked', '.rbi-checked', '.rbi-unchecked']) {
      expect(effectiveOpacity(at(root, `${sel} [class*='__']`)), sel).toBe(1);
    }
  });

  it('paints the checkbox stroke and checked fill with the disabled colour', () => {
    const root = mount();
    const colour = disabledColour(root);
    expect(computedValue(at(root, '.cbi-unchecked .cngx-checkbox-indicator__box'), 'border-top-color')).toBe(colour);
    expect(computedValue(at(root, '.cbi-checked .cngx-checkbox-indicator__box'), 'background-color')).toBe(colour);
    expect(computedValue(at(root, '.cbi-checked .cngx-checkbox-indicator__box'), 'border-top-color')).toBe(colour);
  });

  it('switches the checked glyph to the surface so it reads on the grey fill', () => {
    const root = mount();
    expect(computedValue(at(root, '.cbi-checked .cngx-checkbox-indicator__check'), 'color')).toBe(
      computedValue(at(root, '.probe-surface'), 'color'),
    );
  });

  it('paints the radio ring and dot with the disabled colour', () => {
    const root = mount();
    const colour = disabledColour(root);
    expect(computedValue(at(root, '.rbi-checked .cngx-radio-indicator__circle'), 'border-top-color')).toBe(colour);
    expect(computedValue(at(root, '.rbi-checked .cngx-radio-indicator__dot'), 'background-color')).toBe(colour);
    expect(computedValue(at(root, '.rbi-unchecked .cngx-radio-indicator__circle'), 'border-top-color')).toBe(colour);
  });

  it('reads GrayText under forced colors, the enabled indicator does not', async () => {
    await forceColors(scheme);
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    expect(computedValue(at(root, '.cbi-unchecked .cngx-checkbox-indicator__box'), 'border-top-color')).toBe(gray);
    expect(computedValue(at(root, '.cbi-checked .cngx-checkbox-indicator__box'), 'background-color')).toBe(gray);
    expect(computedValue(at(root, '.cbi-checked .cngx-checkbox-indicator__box'), 'forced-color-adjust')).toBe('none');
    expect(computedValue(at(root, '.rbi-checked .cngx-radio-indicator__circle'), 'border-top-color')).toBe(gray);
    expect(computedValue(at(root, '.rbi-checked .cngx-radio-indicator__dot'), 'background-color')).toBe(gray);
    expect(computedValue(at(root, '.cbi-enabled .cngx-checkbox-indicator__box'), 'border-top-color')).not.toBe(gray);
  });

  it('paints checked indicators in the row ink inside a row that opts out of forcing', async () => {
    await forceColors(scheme);
    const root = mount();
    const ink = computedValue(one(root, '.probe-highlighttext'), 'color');
    const box = one(root, '.opted-out .cngx-checkbox-indicator__box');
    expect(computedValue(box, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(box, 'border-top-color')).toBe(ink);
    expect(computedValue(one(root, '.opted-out .cngx-checkbox-indicator__check'), 'color')).toBe(ink);
    expect(computedValue(one(root, '.opted-out .cngx-radio-indicator__dot'), 'background-color')).toBe(ink);
    expect(computedValue(one(root, '.opted-out .cngx-radio-indicator__circle'), 'border-top-color')).toBe(ink);
    expect(computedValue(at(root, '.cbi-enabled .cngx-checkbox-indicator__box'), 'border-top-color')).toBe(
      computedValue(one(root, '.probe-canvastext'), 'color'),
    );
    expect(computedValue(one(root, '.plain-radio .cngx-radio-indicator__dot'), 'background-color')).toBe(
      computedValue(one(root, '.probe-canvastext'), 'color'),
    );
  });
});
