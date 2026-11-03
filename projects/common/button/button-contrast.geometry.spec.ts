import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxButton } from './button.component';

// Runs in a real Chromium (the `test-geometry` target). Pins WCAG 1.4.3 for
// the label on a solid primary / danger fill in both default schemes: the
// default palette alone, no theme bridge. jsdom reports `''` for every read.

@Component({
  selector: 'cngx-button-contrast-geometry-host',
  standalone: true,
  imports: [CngxButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    './button.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <p [attr.data-color-scheme]="scheme" style="--cngx-button-transition: 0s">
        <button cngxButton tone="primary" class="b-primary-{{ scheme }}">Save</button>
        <button cngxButton tone="danger" class="b-danger-{{ scheme }}">Delete</button>
      </p>
    }
  `,
})
class ContrastHost {
  protected readonly schemes = ['light', 'dark'] as const;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ContrastHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

// Chromium reports the tokens in oklch / color() notation; painting the colour
// and reading the pixel back is the stable way to get sRGB bytes.
function toRgb(color: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(toRgb(a));
  const lb = relativeLuminance(toRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('solid button label contrast (default palette)', () => {
  it.each([
    ['primary', 'light'],
    ['primary', 'dark'],
    ['danger', 'light'],
    ['danger', 'dark'],
  ] as const)('solid %s in the %s scheme clears 4.5:1', (tone, scheme) => {
    const button = query(mount(), `.b-${tone}-${scheme}`);
    const ratio = contrast(
      computedValue(button, 'color'),
      computedValue(button, 'background-color'),
    );
    expect(ratio, `${tone} / ${scheme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});
