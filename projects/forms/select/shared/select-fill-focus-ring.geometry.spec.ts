/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). On the tinted fill
// surface the primary accent drops an inner focus ring under the 3:1
// non-text contrast floor (WCAG 1.4.11), so under `[data-skin='fill']` the
// inner rings fall back to the strong accent. Measured against the painted
// trigger surface, composited over the page surface, in both schemes.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-select-fill-ring-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    './select-base.css',
    '../single-select/select.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface); padding: 8px"
      >
        <div class="cngx-select" data-skin="fill">
          <div>
            <div class="cngx-field-trigger">
              <button type="button" class="cngx-select__clear">x</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
class FillRingHost {
  readonly schemes = SCHEMES;
}

/** Paints the colours in order on a 1x1 canvas and reads the composited sRGB pixel. */
function paint(...colours: string[]): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  for (const colour of colours) {
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let mountedRoot: HTMLElement | null = null;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select-family inner focus ring on the fill surface', () => {
  it.each(SCHEMES)('holds 3:1 against the fill trigger surface (%s)', (scheme) => {
    const fixture = TestBed.createComponent(FillRingHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();

    const page = mountedRoot.querySelector<HTMLElement>(`.scheme-${scheme}`)!;
    const trigger = page.querySelector<HTMLElement>('.cngx-field-trigger')!;
    const clear = page.querySelector<HTMLElement>('.cngx-select__clear')!;
    clear.focus();
    expect(clear.matches(':focus-visible')).toBe(true);

    const surface = paint(
      computedValue(page, 'background-color'),
      computedValue(trigger, 'background-color'),
    );
    const ring = paint(
      computedValue(page, 'background-color'),
      computedValue(clear, 'outline-color'),
    );
    expect(computedValue(clear, 'outline-style')).toBe('solid');
    expect(contrast(ring, surface)).toBeGreaterThanOrEqual(3);
  });
});
