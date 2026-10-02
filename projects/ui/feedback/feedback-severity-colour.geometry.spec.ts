/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The severity glyphs
// of alert, alert stack, banner and toast derive from the core
// `--cngx-color-{info,success,warning,danger}` instead of carrying their own
// literals: the toast stripe and icon paint the core colour on the toast
// surface, the alert / banner icon mixes it 90% into the text colour so it
// still clears 3:1 on the pale severity tint. The alert, stack and banner bg
// and border tints keep the earlier hand-picked pastel lightness and chroma
// and take only the hue from the same core colour (relative colour syntax),
// and the banner inline error reads the danger text rung. A brand override of the core colour therefore reaches every
// family. Schemes are emulated page-wide: the toast surface resolves at the
// root, so a scheme island would not reach it.

const SCHEMES = ['light', 'dark'] as const;
// Lightness and chroma [bg, border] of each severity tint; the hue is the
// core colour's.
const TINT = {
  light: {
    info: ['0.96 0.025', '0.85 0.07'],
    success: ['0.96 0.04', '0.85 0.1'],
    warning: ['0.97 0.04', '0.86 0.1'],
    error: ['0.96 0.025', '0.85 0.08'],
  },
  dark: {
    info: ['0.3 0.05', '0.5 0.08'],
    success: ['0.3 0.06', '0.5 0.1'],
    warning: ['0.32 0.06', '0.55 0.1'],
    error: ['0.3 0.05', '0.5 0.1'],
  },
} as const;
// The hand-picked palette the tints replaced, [bg, border].
const PREVIOUS = {
  light: {
    info: ['oklch(0.96 0.025 250)', 'oklch(0.85 0.07 250)'],
    success: ['oklch(0.96 0.04 145)', 'oklch(0.85 0.1 145)'],
    warning: ['oklch(0.97 0.04 80)', 'oklch(0.86 0.1 80)'],
    error: ['oklch(0.96 0.025 25)', 'oklch(0.85 0.08 25)'],
  },
  dark: {
    info: ['oklch(0.3 0.05 250)', 'oklch(0.5 0.08 250)'],
    success: ['oklch(0.3 0.06 145)', 'oklch(0.5 0.1 145)'],
    warning: ['oklch(0.32 0.06 80)', 'oklch(0.55 0.1 80)'],
    error: ['oklch(0.3 0.05 25)', 'oklch(0.5 0.1 25)'],
  },
} as const;
const SEVERITIES = ['info', 'success', 'warning', 'error'] as const;
const CORE: Record<(typeof SEVERITIES)[number], string> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger',
};

@Component({
  selector: 'cngx-feedback-severity-colour-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './alert/alert.css',
    './alert/alert-stack.css',
    './banner/banner-outlet.css',
    './toast/toast-outlet.css',
  ],
  encapsulation: ViewEncapsulation.None,
  // Bare outlet tags carry only the shipped classes; the components
  // themselves are not under test here.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="page" style="background: var(--cngx-color-surface)">
      @for (severity of severities; track severity) {
        <div [class]="'cngx-alert cngx-alert--' + severity + ' alert-' + severity">
          <span class="cngx-alert__icon">!</span>
        </div>
      }
      <div class="cngx-alert-stack">
        @for (severity of severities; track severity) {
          <div
            [class]="
              'cngx-alert-stack__item cngx-alert-stack__item--' + severity + ' stack-' + severity
            "
          >
            <span class="cngx-alert-stack__icon">!</span>
          </div>
        }
      </div>
      <cngx-banner-outlet class="cngx-banner-outlet">
        @for (severity of severities; track severity) {
          <div [class]="'cngx-banner cngx-banner--' + severity + ' banner-' + severity">
            <span class="cngx-banner__icon">!</span>
            <span class="cngx-banner__error">Retry failed</span>
          </div>
        }
      </cngx-banner-outlet>
      <cngx-toast-outlet class="cngx-toast-outlet">
        @for (severity of severities; track severity) {
          <div [class]="'cngx-toast cngx-toast--' + severity + ' toast-' + severity">
            <span class="cngx-toast__icon">!</span>
          </div>
        }
      </cngx-toast-outlet>
      @for (severity of severities; track severity) {
        <span
          [class]="'probe-core-' + severity"
          [style.color]="'var(--cngx-color-' + core[severity] + ')'"
        ></span>
        <span
          [class]="'probe-mix-' + severity"
          [style.color]="
            'color-mix(in oklab, var(--cngx-color-' +
            core[severity] +
            ') 90%, var(--cngx-color-text))'
          "
        ></span>
      }
      <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      <span class="probe-text" style="color: var(--cngx-color-text)"></span>
      <span class="probe-danger-text" style="color: var(--cngx-color-danger-text)"></span>
    </div>
  `,
})
class SeverityColourHost {
  readonly severities = SEVERITIES;
  readonly core = CORE;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SeverityColourHost);
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

// Paint the colours bottom-up into a 1px canvas and read the pixel back: this
// resolves oklch / oklab / color-mix to sRGB the way the page renders it.
function paint(...layers: string[]): [number, number, number] {
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
  return [r, g, b];
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const ink = (el: HTMLElement): [number, number, number] =>
  paint('#fff', computedValue(el, 'color'));

// A colour resolved in the page's scheme, through a throwaway probe span.
function resolve(root: HTMLElement, color: string): [number, number, number] {
  const span = document.createElement('span');
  span.style.color = color;
  one(root, '.page').appendChild(span);
  const rgb = ink(span);
  span.remove();
  return rgb;
}

// Euclidean distance in oklab x100: about 2 is a just-noticeable step.
function distance(a: [number, number, number], b: [number, number, number]): number {
  const oklab = (rgb: [number, number, number]): number[] => {
    const [r, g, bl] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  };
  const [x, y] = [oklab(a), oklab(b)];
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('feedback severity colour, %s', (scheme) => {
  beforeEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
  });

  const at = one;

  describe.each(SEVERITIES)('%s', (severity) => {
    it('paints the toast stripe and icon in the core colour', () => {
      const root = mount();
      const toast = at(root, `.toast-${severity}`);
      const core = ink(at(root, `.probe-core-${severity}`));
      expect(paint('#fff', computedValue(toast, 'border-inline-start-color'))).toEqual(core);
      expect(ink(one(toast, '.cngx-toast__icon'))).toEqual(core);
    });

    it('paints the alert, stack and banner icon in the core colour 90% into the text', () => {
      const root = mount();
      const mixed = ink(at(root, `.probe-mix-${severity}`));
      expect(ink(at(root, `.alert-${severity} .cngx-alert__icon`))).toEqual(mixed);
      expect(ink(at(root, `.stack-${severity} .cngx-alert-stack__icon`))).toEqual(mixed);
      expect(ink(at(root, `.banner-${severity} .cngx-banner__icon`))).toEqual(mixed);
    });

    it('derives the alert, stack and banner bg and border tints from the core colour', () => {
      const root = mount();
      const [bgLc, borderLc] = TINT[scheme][severity];
      const tint = (lc: string): [number, number, number] =>
        resolve(root, `oklch(from var(--cngx-color-${CORE[severity]}) ${lc} h)`);
      const bg = tint(bgLc);
      const border = tint(borderLc);
      for (const [host, edge] of [
        [`.alert-${severity}`, 'border-top-color'],
        [`.stack-${severity}`, 'border-top-color'],
        [`.banner-${severity}`, 'border-bottom-color'],
      ] as const) {
        const el = at(root, host);
        expect(paint('#fff', computedValue(el, 'background-color')), host).toEqual(bg);
        expect(paint('#fff', computedValue(el, edge)), host).toEqual(border);
      }
    });

    // Lightness and chroma are the previous ones, so only a hue offset
    // remains: the previous info tints sat at hue 250, the core info is 240,
    // which leaves the info border (and the dark info bg) at about 1.4.
    it('stays close to the previous hand-picked tint', () => {
      const root = mount();
      const [oldBg, oldBorder] = PREVIOUS[scheme][severity];
      const cap = severity === 'info' ? 1.5 : 1;
      const alert = at(root, `.alert-${severity}`);
      expect(
        distance(paint('#fff', computedValue(alert, 'background-color')), resolve(root, oldBg)),
        'bg',
      ).toBeLessThan(cap);
      expect(
        distance(paint('#fff', computedValue(alert, 'border-top-color')), resolve(root, oldBorder)),
        'border',
      ).toBeLessThan(cap);
    });

    it('keeps body text at 4.5:1 on every tint', () => {
      const root = mount();
      const text = ink(at(root, '.probe-text'));
      for (const host of [`.alert-${severity}`, `.stack-${severity}`, `.banner-${severity}`]) {
        const tint = paint('#fff', computedValue(at(root, host), 'background-color'));
        expect(contrast(text, tint), host).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('paints the banner inline error in the danger text rung at 4.5:1 on the tint', () => {
      const root = mount();
      const banner = at(root, `.banner-${severity}`);
      const error = one(banner, '.cngx-banner__error');
      expect(ink(error)).toEqual(ink(at(root, '.probe-danger-text')));
      const tint = paint('#fff', computedValue(banner, 'background-color'));
      expect(contrast(ink(error), tint)).toBeGreaterThanOrEqual(4.5);
    });

    // The glyph identifies the severity (1.4.11). The derivation keeps 3:1
    // wherever the core colour itself clears 3:1 on the surface; core pins
    // that for every severity in its own spec.
    it('clears 3:1 on its ground whenever the core colour clears it on the surface', () => {
      const root = mount();
      const surface = paint('#fff', computedValue(at(root, '.probe-surface'), 'color'));
      const core = ink(at(root, `.probe-core-${severity}`));
      if (contrast(core, surface) < 3) {
        return;
      }
      const toast = at(root, `.toast-${severity}`);
      expect(
        contrast(
          ink(one(toast, '.cngx-toast__icon')),
          paint('#fff', computedValue(toast, 'background-color')),
        ),
        'toast',
      ).toBeGreaterThanOrEqual(3);
      for (const [host, icon] of [
        [`.alert-${severity}`, '.cngx-alert__icon'],
        [`.stack-${severity}`, '.cngx-alert-stack__icon'],
        [`.banner-${severity}`, '.cngx-banner__icon'],
      ] as const) {
        const ground = at(root, host);
        const tint = paint('#fff', computedValue(ground, 'background-color'));
        expect(contrast(ink(one(ground, icon)), tint), host).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
