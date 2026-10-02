/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Where colour is the
// only marker of the current crumb (toolbar, chips, iconlabel, path, the
// editorial gradient, the siblings current row, the overflow hover and the
// open siblings caret), it paints the primary text rung
// (`--cngx-color-primary-text`, falling back to primary mixed 70% into the
// text colour) at 4.5:1 instead of the raw primary (2.9-3.3:1 on light). The
// filled skins (pill, ribbon, icononly) keep the raw primary fill and set the
// label (and the icononly glyph, currentColor) in the scheme's dark neutral:
// the text colour in light, the surface colour in dark. A declared
// --cngx-color-on-primary still wins. The path separator reads the muted text
// colour.
// Under forced colors the current sibling row paints the Highlight pair.

const SCHEMES = ['light', 'dark'] as const;
const TEXT_SKINS = ['toolbar', 'chips', 'iconlabel', 'path'] as const;
const FILLED_SKINS = ['pill', 'ribbon', 'icononly'] as const;

@Component({
  selector: 'cngx-breadcrumb-current-contrast-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './breadcrumb-bar.component.css',
    './breadcrumb-overflow.component.css',
    './breadcrumb-siblings.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface); color: var(--cngx-color-text)"
      >
        @for (skin of skins; track skin) {
          <div [attr.data-skin]="skin" [class]="'cngx-breadcrumb skin-' + skin">
            <nav>
              <ol class="cngx-breadcrumb__list">
                <li class="cngx-breadcrumb__crumb">
                  <a class="cngx-breadcrumb__link" href="#berlin"
                    ><span class="cngx-breadcrumb__label">Berlin</span></a
                  >
                </li>
                <li class="cngx-breadcrumb__separator">/</li>
                <li class="cngx-breadcrumb__crumb">
                  <a class="cngx-breadcrumb__link current" aria-current="page"
                    ><svg class="glyph" width="16" height="16" aria-hidden="true">
                      <rect width="16" height="16" fill="currentColor" /></svg
                    ><span class="cngx-breadcrumb__label">Mitte</span></a
                  >
                </li>
              </ol>
            </nav>
          </div>
        }
        <div class="hook" style="--cngx-color-on-primary: rgb(1, 2, 3)">
          <div data-skin="pill" class="cngx-breadcrumb">
            <ol class="cngx-breadcrumb__list">
              <li class="cngx-breadcrumb__crumb">
                <a class="cngx-breadcrumb__link current" aria-current="page"
                  ><span class="cngx-breadcrumb__label">Mitte</span></a
                >
              </li>
            </ol>
          </div>
        </div>
        <button type="button" class="cngx-breadcrumb__overflow-trigger" style="transition: none">
          ...
        </button>
        <button
          type="button"
          class="cngx-breadcrumb__siblings-trigger"
          aria-expanded="true"
          style="transition: none"
        >
          v
        </button>
        <ul class="cngx-breadcrumb__siblings-menu">
          <li class="cngx-breadcrumb__siblings-item sibling-rest">
            <a class="cngx-breadcrumb__siblings-link" href="#kreuzberg">Kreuzberg</a>
          </li>
          <li class="cngx-breadcrumb__siblings-item sibling-current" aria-current="page">Mitte</li>
        </ul>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
        <span
          class="probe-pt"
          style="color: color-mix(in oklab, var(--cngx-color-primary) 70%, var(--cngx-color-text))"
        ></span>
        <span class="probe-primary" style="color: var(--cngx-color-primary)"></span>
        <span class="probe-text" style="color: var(--cngx-color-text)"></span>
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
        <span class="probe-highlight" style="color: Highlight"></span>
        <span class="probe-highlighttext" style="color: HighlightText"></span>
      </div>
    }
  `,
})
class CurrentHost {
  readonly schemes = SCHEMES;
  readonly skins = [...TEXT_SKINS, ...FILLED_SKINS, 'editorial'];
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CurrentHost);
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

type Rgb = [number, number, number];

// Paint the colours bottom-up into a 1px canvas and read the pixel back: this
// resolves oklch / oklab / color-mix to sRGB and composites translucent tints.
function paint(...layers: string[]): Rgb {
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

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The painted ground of an element: every background from the scheme wrapper
// down to the element, composited in order.
function ground(el: HTMLElement): Rgb {
  const layers: string[] = [];
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    layers.unshift(computedValue(node, 'background-color'));
    if (node.hasAttribute('data-color-scheme')) {
      break;
    }
  }
  return paint('#fff', ...layers);
}

const ink = (el: HTMLElement): Rgb => paint('#fff', computedValue(el, 'color'));

// Colour stops of a computed linear-gradient, in order.
function stops(el: HTMLElement): string[] {
  return (
    computedValue(el, 'background-image').match(/(?:rgba?|oklab|oklch|color)\([^()]*\)/g) ?? []
  );
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('breadcrumb current marker by colour, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it.each(TEXT_SKINS)('%s paints the current crumb in the primary text rung at 4.5:1', (skin) => {
    const root = mount();
    const current = at(root, `.skin-${skin} .current`);
    expect(ink(current)).toEqual(ink(at(root, '.probe-pt')));
    expect(contrast(ink(current), ground(current))).toBeGreaterThanOrEqual(4.5);
  });

  // The dark neutral of the scheme: the text colour on light, the surface on dark.
  const darkInk = scheme === 'light' ? '.probe-text' : '.probe-surface';

  it.each(FILLED_SKINS)(
    '%s keeps the primary fill and sets the label in the dark ink at 4.5:1',
    (skin) => {
      const root = mount();
      const current = at(root, `.skin-${skin} .current`);
      expect(paint('#fff', computedValue(current, 'background-color'))).toEqual(
        ink(at(root, '.probe-primary')),
      );
      expect(ink(current)).toEqual(ink(at(root, darkInk)));
      expect(contrast(ink(current), ground(current))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('draws the icononly current glyph in the dark ink at 3:1 on the fill', () => {
    const root = mount();
    const current = at(root, '.skin-icononly .current');
    const glyph = paint(
      '#fff',
      computedValue(at(root, '.skin-icononly .current .glyph rect'), 'fill'),
    );
    expect(glyph).toEqual(ink(at(root, darkInk)));
    expect(contrast(glyph, ground(current))).toBeGreaterThanOrEqual(3);
  });

  it('honours a declared --cngx-color-on-primary on the filled label', () => {
    const root = mount();
    expect(computedValue(at(root, '.hook .current'), 'color')).toBe('rgb(1, 2, 3)');
  });

  it('starts both editorial gradient stops at 4.5:1 or more', () => {
    const root = mount();
    const current = at(root, '.skin-editorial .current');
    const gradient = stops(current);
    expect(gradient.length).toBeGreaterThanOrEqual(2);
    expect(paint('#fff', gradient[0])).toEqual(ink(at(root, '.probe-pt')));
    for (const stop of gradient) {
      expect(contrast(paint('#fff', stop), ground(current)), stop).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('reads the path separator in the muted text colour at 4.5:1', () => {
    const root = mount();
    const separator = at(root, '.skin-path .cngx-breadcrumb__separator');
    expect(ink(separator)).toEqual(ink(at(root, '.probe-muted')));
    expect(contrast(ink(separator), ground(separator))).toBeGreaterThanOrEqual(4.5);
  });

  it('paints the current sibling and the open caret in the rung at 4.5:1', () => {
    const root = mount();
    const pt = ink(at(root, '.probe-pt'));
    for (const sel of ['.sibling-current', '.cngx-breadcrumb__siblings-trigger']) {
      const el = at(root, sel);
      expect(ink(el), sel).toEqual(pt);
      expect(contrast(ink(el), ground(el)), sel).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('paints the hovered overflow glyph in the rung at 4.5:1', async () => {
    const root = mount();
    const trigger = at(root, '.cngx-breadcrumb__overflow-trigger');
    await userEvent.hover(trigger);
    expect(ink(trigger)).toEqual(ink(at(root, '.probe-pt')));
    expect(contrast(ink(trigger), ground(trigger))).toBeGreaterThanOrEqual(4.5);
  });
});

describe.each(SCHEMES)('breadcrumb siblings under forced colors, %s', (scheme) => {
  it('paints the current sibling row in the Highlight pair, the rest stay forced', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const at = (selector: string): HTMLElement => one(root, `.scheme-${scheme} ${selector}`);
    // A plain author colour is forced, so the emulation is live.
    expect(computedValue(at('.plain'), 'color')).not.toBe('rgb(200, 0, 0)');
    const current = at('.sibling-current');
    expect(computedValue(current, 'forced-color-adjust')).toBe('none');
    expect(computedValue(current, 'background-color')).toBe(
      computedValue(at('.probe-highlight'), 'color'),
    );
    expect(computedValue(current, 'color')).toBe(
      computedValue(at('.probe-highlighttext'), 'color'),
    );
    expect(computedValue(at('.sibling-rest'), 'forced-color-adjust')).not.toBe('none');
    // #503: the bar's current crumb keeps its Highlight treatment.
    expect(computedValue(at('.skin-toolbar .current'), 'background-color')).toBe(
      computedValue(at('.probe-highlight'), 'color'),
    );
  });
});
