import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Rendered tier for the core `--cngx-color-primary-text` rung (core has no
// geometry target; this one already renders system-tokens.css). Primary as
// text clears 4.5:1 on the surface in both schemes, and the surface colour
// painted on a fill of the rung clears 4.5:1 too (filled current-state skins
// rely on that pairing). The source contract lives in core
// color-text-tokens.spec.ts.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-primary-text-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface); color: var(--cngx-color-text)"
      >
        <span class="as-text" style="color: var(--cngx-color-primary-text)">Current</span>
        <span
          class="as-fill"
          style="background: var(--cngx-color-primary-text); color: var(--cngx-color-surface)"
          >Current</span
        >
        <span
          class="probe-mix"
          style="color: color-mix(in oklab, var(--cngx-color-primary) 70%, var(--cngx-color-text))"
        ></span>
        <span class="probe-primary" style="color: var(--cngx-color-primary)"></span>
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      </div>
    }
  `,
})
class PrimaryTextHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PrimaryTextHost);
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

// Rasterise a computed colour to sRGB bytes: Chromium reports these tokens in
// oklab / oklch notation, so painting and reading the pixel back is the
// robust comparison.
function toRgb(color: string): [number, number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a];
}

function luminance(color: string): number {
  const [r, g, b] = toRgb(color)
    .slice(0, 3)
    .map((v) => v / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('--cngx-color-primary-text, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('resolves to primary mixed 70% toward the text colour in oklab', () => {
    const root = mount();
    const text = toRgb(computedValue(at(root, '.as-text'), 'color'));
    expect(text).toEqual(toRgb(computedValue(at(root, '.probe-mix'), 'color')));
    expect(text).not.toEqual(toRgb(computedValue(at(root, '.probe-primary'), 'color')));
  });

  it('reads at 4.5:1 or more as text on the surface', () => {
    const root = mount();
    const surface = computedValue(at(root, '.probe-surface'), 'color');
    expect(contrast(computedValue(at(root, '.as-text'), 'color'), surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('carries surface-coloured text at 4.5:1 or more as a fill', () => {
    const root = mount();
    const fill = at(root, '.as-fill');
    const background = computedValue(fill, 'background-color');
    expect(toRgb(background)[3]).toBe(255);
    expect(contrast(computedValue(fill, 'color'), background)).toBeGreaterThanOrEqual(4.5);
  });
});
