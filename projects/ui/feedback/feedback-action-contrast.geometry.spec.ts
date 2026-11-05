/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). An enabled alert,
// banner or toast action paints its label in the severity accent mixed into
// the text colour, so it clears 4.5:1 on the light severity tint (alert,
// banner) or the toast surface as well as on the hover overlay; the pure
// accent missed it (2.1-3.6). The border follows the label, and a
// per-instance `--cngx-*-action-color` pin still wins. The toast background
// resolves at the root, so a scheme island would not reach it: the toast rows
// emulate the scheme page-wide instead.

const SCHEMES = ['light', 'dark'] as const;
const SEVERITIES = ['info', 'success', 'warning', 'error'] as const;

@Component({
  selector: 'cngx-feedback-action-contrast-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './styles/feedback-severity.css',
    './alert/alert.css',
    './banner/banner-outlet.css',
    './toast/toast-outlet.css',
  ],
  encapsulation: ViewEncapsulation.None,
  // Bare outlet tags carry only the shipped classes; the components
  // themselves are not under test here.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        @for (severity of severities; track severity) {
          <div [class]="'cngx-alert cngx-alert--' + severity + ' alert-' + severity">
            <button type="button" class="cngx-alert__action">Retry</button>
          </div>
        }
        <cngx-banner-outlet class="cngx-banner-outlet">
          @for (severity of severities; track severity) {
            <div [class]="'cngx-banner cngx-banner--' + severity + ' banner-' + severity">
              <button type="button" class="cngx-banner__action">Reconnect</button>
            </div>
          }
        </cngx-banner-outlet>
        <div class="cngx-alert cngx-alert--warning pinned-alert">
          <button
            type="button"
            class="cngx-alert__action"
            style="--cngx-alert-action-color: var(--cngx-alert-icon-color)"
          >
            Pinned
          </button>
        </div>
      </div>
    }
    @if (toasts) {
      <!-- Fixed overlay: rendered only for the toast rows so it never covers
           the alert and banner actions. -->
      <cngx-toast-outlet class="cngx-toast-outlet cngx-toast-outlet--top-start">
        @for (severity of severities; track severity) {
          <div [class]="'cngx-toast cngx-toast--' + severity + ' toast-' + severity">
            <span class="cngx-toast__body">Message archived</span>
            <button type="button" class="cngx-toast__action">Undo</button>
          </div>
        }
      </cngx-toast-outlet>
    }
  `,
})
class ActionContrastHost {
  readonly schemes = SCHEMES;
  readonly severities = SEVERITIES;
  toasts = false;
}

let mountedRoot: HTMLElement | null = null;

function mount(toasts = false): HTMLElement {
  const fixture = TestBed.createComponent(ActionContrastHost);
  fixture.componentInstance.toasts = toasts;
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
// resolves oklch / oklab / color-mix to sRGB and composites a translucent
// overlay (the hover tint) over its surface the way the page renders it.
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

// Label against the action's own (transparent or hover) background laid over
// the severity surface it sits on.
function labelContrast(action: HTMLElement, surface: HTMLElement): number {
  const ink = paint('#fff', computedValue(action, 'color'));
  const background = paint(
    '#fff',
    computedValue(surface, 'background-color'),
    computedValue(action, 'background-color'),
  );
  return contrast(ink, background);
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('enabled feedback action contrast, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  describe.each(SEVERITIES)('%s', (severity) => {
    const families = [
      ['alert', '.cngx-alert__action'],
      ['banner', '.cngx-banner__action'],
    ] as const;

    it('clears 4.5:1 at rest, the border following the label', () => {
      const root = mount();
      for (const [family, actionSel] of families) {
        const surface = at(root, `.${family}-${severity}`);
        const action = one(surface, actionSel);
        expect(labelContrast(action, surface), family).toBeGreaterThanOrEqual(4.5);
        expect(computedValue(action, 'border-top-color'), family).toBe(
          computedValue(action, 'color'),
        );
      }
    });

    it('clears 4.5:1 on the hover overlay', async () => {
      const root = mount();
      for (const [family, actionSel] of families) {
        const surface = at(root, `.${family}-${severity}`);
        const action = one(surface, actionSel);
        const rest = computedValue(action, 'background-color');
        await userEvent.hover(action);
        // The hover overlay is really applied, so the ratio is the hover one.
        expect(computedValue(action, 'background-color'), family).not.toBe(rest);
        expect(labelContrast(action, surface), family).toBeGreaterThanOrEqual(4.5);
        await userEvent.unhover(action);
      }
    });
  });

  it('lets a consumer pin the action back to the pure accent', () => {
    const root = mount();
    const pinned = at(root, '.pinned-alert .cngx-alert__action');
    const icon = computedValue(at(root, '.pinned-alert'), '--cngx-alert-icon-color');
    expect(paint(computedValue(pinned, 'color'))).toEqual(paint(icon));
    const derived = at(root, '.alert-warning .cngx-alert__action');
    expect(paint(computedValue(derived, 'color'))).not.toEqual(paint(icon));
  });
});

describe.each(SCHEMES)('enabled toast action contrast, %s', (scheme) => {
  beforeEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
  });

  describe.each(SEVERITIES)('%s', (severity) => {
    it('clears 4.5:1 at rest, the border following the label', () => {
      const root = mount(true);
      const toast = one(root, `.toast-${severity}`);
      const action = one(toast, '.cngx-toast__action');
      expect(labelContrast(action, toast)).toBeGreaterThanOrEqual(4.5);
      expect(computedValue(action, 'border-top-color')).toBe(computedValue(action, 'color'));
    });

    it('clears 4.5:1 on the hover overlay', async () => {
      const root = mount(true);
      const toast = one(root, `.toast-${severity}`);
      const action = one(toast, '.cngx-toast__action');
      const rest = computedValue(action, 'background-color');
      await userEvent.hover(action);
      expect(computedValue(action, 'background-color')).not.toBe(rest);
      expect(labelContrast(action, toast)).toBeGreaterThanOrEqual(4.5);
      await userEvent.unhover(action);
    });
  });
});
