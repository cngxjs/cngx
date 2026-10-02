import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Rendered tier for the core semantic colours as graphics: a severity glyph,
// stripe or dot painted in --cngx-color-{success,warning,danger,info} has to
// clear 3:1 (WCAG 1.4.11) on --cngx-color-surface in both schemes. The light
// warning is the tight one (amber is the brightest hue). The source contract
// lives in core color-text-tokens.spec.ts.

const SCHEMES = ['light', 'dark'] as const;
const SEVERITIES = ['success', 'warning', 'danger', 'info'] as const;

@Component({
  selector: 'cngx-semantic-graphic-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        @for (severity of severities; track severity) {
          <span
            [class]="'glyph-' + severity"
            [style.color]="'var(--cngx-color-' + severity + ')'"
          ></span>
        }
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      </div>
    }
  `,
})
class SemanticGraphicHost {
  readonly schemes = SCHEMES;
  readonly severities = SEVERITIES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SemanticGraphicHost);
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

describe.each(SCHEMES)('semantic colours as graphics, %s', (scheme) => {
  it.each(SEVERITIES)('%s clears 3:1 on the surface', (severity) => {
    const root = mount();
    const glyph = one(root, `.scheme-${scheme} .glyph-${severity}`);
    const surface = computedValue(one(root, `.scheme-${scheme} .probe-surface`), 'color');
    expect(contrast(computedValue(glyph, 'color'), surface)).toBeGreaterThanOrEqual(3);
  });
});
