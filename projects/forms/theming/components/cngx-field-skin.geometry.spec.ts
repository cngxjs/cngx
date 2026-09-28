import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Computed tier. Runs in a real Chromium (the `test-geometry` target) against
// the exact Track-B file loaded through `styleUrls` under
// `ViewEncapsulation.None`, because this CSS ships in the aggregated
// `cngx.css` and sits on no component styleUrl. jsdom reports `''` for these
// reads. The source-text tier - density derivation, @media placement,
// :scope-only outline suppression - lives in `cngx-field-skin.css.spec.ts`,
// which runs under node and can read the file.

@Component({
  selector: 'cngx-field-skin-geometry-host',
  standalone: true,
  // The reset comes along because the skins are authored against it: it owns
  // `box-sizing: border-box` and the `:focus-visible` ring the fill scope
  // suppresses on its own root and the bare scope keeps.
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    './cngx-field-skin.css',
    './cngx-field-affix.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <input class="solo-fill" type="text" data-skin="fill" />
    <input class="fill-invalid" type="text" data-skin="fill" aria-invalid="true" />
    <input class="fill-disabled" type="text" data-skin="fill" disabled />
    <span
      class="probe-underline"
      style="background: var(
        --cngx-field-underline-focus-color,
        oklch(0.58 0.19 50)
      )"
    ></span>
    <span
      class="probe-hover"
      style="background: var(
        --cngx-field-fill-bg-hover,
        color-mix(in oklab, var(--cngx-color-text) 8%, var(--cngx-field-fill-bg))
      )"
    ></span>
    <input class="solo-bare" type="text" data-skin="bare" />
    <input class="bare-disabled" type="text" data-skin="bare" disabled />
    <input class="bare-invalid" type="text" data-skin="bare" aria-invalid="true" />
    <div data-color-scheme="dark">
      <input class="bare-invalid-dark" type="text" data-skin="bare" aria-invalid="true" />
    </div>
    <span class="cngx-field-box cngx-field-affix-row bare-row" data-skin="bare">
      <span class="cngx-field-prefix">$</span>
      <input class="bare-row-input" type="text" data-skin="bare" aria-invalid="true" />
    </span>
    <div data-color-scheme="light">
      <input class="fill-light" type="text" data-skin="fill" />
      <span
        class="probe-underline-light"
        style="background: var(--cngx-field-underline-focus-color)"
      ></span>
      <span
        class="probe-hover-light"
        style="background: var(
          --cngx-field-fill-bg-hover,
          color-mix(in oklab, var(--cngx-color-text) 8%, var(--cngx-field-fill-bg))
        )"
      ></span>
    </div>
    <div data-color-scheme="dark">
      <input class="fill-dark" type="text" data-skin="fill" />
      <span
        class="probe-underline-dark"
        style="background: var(--cngx-field-underline-focus-color)"
      ></span>
      <span
        class="probe-hover-dark"
        style="background: var(
          --cngx-field-fill-bg-hover,
          color-mix(in oklab, var(--cngx-color-text) 8%, var(--cngx-field-fill-bg))
        )"
      ></span>
    </div>
    <span class="cngx-field-box cngx-field-affix-row row" data-skin="fill">
      <span class="cngx-field-prefix">$</span>
      <input class="nested-fill" type="text" data-skin="bare" />
    </span>
    <span class="cngx-field-box cngx-field-affix-row outline-row" data-skin="outline">
      <span class="cngx-field-prefix">$</span>
      <input class="nested-outline" type="text" data-skin="bare" />
    </span>
    <span class="cngx-field-box cngx-field-affix-row projected-row" data-skin="outline">
      <input class="projected-fill" type="text" data-skin="fill" aria-invalid="true" />
    </span>
    <table>
      <tbody>
        <tr>
          <td style="padding: 0; width: 200px">
            <input class="cell-bare" type="text" data-skin="bare" />
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class SkinHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SkinHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

// box-shadow transitions over 150ms; reading the moment focus lands catches
// the pre-state frame, not the resolved underline.
function settle(): Promise<void> {
  return new Promise((done) => setTimeout(done, 250));
}

// Rasterise a computed colour to sRGB bytes. Chromium reports these tokens in
// oklab / color() notation depending on the declaration, so parsing the string
// is brittle; painting it and reading the pixel back is not.
function toRgb(color: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  // White underlay so a translucent surface composites the way it renders on
  // the page, which is what the contrast ratio has to be measured against.
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

describe('field skin geometry', () => {
  it('draws the fill skin as an underline, not a box', () => {
    const input = query(mount(), '.solo-fill');
    // 1px on every side keeps the shared box formula; only the bottom edge
    // is painted.
    expect(computedValue(input, 'border-bottom-width')).toBe('1px');
    expect(computedValue(input, 'border-top-width')).toBe('1px');
    expect(computedValue(input, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
  });

  it('grows the underline into the focus colour on focus', async () => {
    const input = query(mount(), '.solo-fill') as HTMLInputElement;
    input.focus();
    await settle();
    expect(computedValue(input, 'box-shadow')).toContain('-2px');
    expect(computedValue(input, 'outline-style')).toBe('none');
  });

  it('keeps the 2px danger underline on an invalid fill field while focused', async () => {
    const root = mount();
    const invalid = query(root, '.fill-invalid') as HTMLInputElement;
    const danger = computedValue(invalid, 'border-bottom-color');
    invalid.focus();
    await settle();
    const shadow = computedValue(invalid, 'box-shadow');
    expect(shadow).toContain('-2px');
    expect(shadow).toContain(danger);
  });

  it('fades a disabled fill field by colour, not opacity', () => {
    const root = mount();
    const disabled = query(root, '.fill-disabled');
    expect(computedValue(disabled, 'opacity')).toBe('1');
    expect(computedValue(disabled, 'border-bottom-style')).toBe('dashed');
    expect(computedValue(disabled, 'color')).not.toBe(
      computedValue(query(root, '.solo-fill'), 'color'),
    );
  });

  it('strips surface and border on the bare skin', () => {
    const input = query(mount(), '.solo-bare');
    expect(computedValue(input, 'border-bottom-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(input, 'background-color')).toBe('rgba(0, 0, 0, 0)');
  });

  it('lets the affix row alone draw the underline', async () => {
    const root = mount();
    const nested = query(root, '.nested-fill') as HTMLInputElement;
    const row = query(root, '.row');
    nested.focus();
    await settle();
    expect(computedValue(nested, 'box-shadow')).toBe('none');
    expect(computedValue(nested, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(row, 'border-bottom-width')).toBe('1px');
  });

  it('moves the outline hairline from the control to an outline box', () => {
    const root = mount();
    const row = query(root, '.outline-row');
    const nested = query(root, '.nested-outline');
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(computedValue(row, `border-${side}-width`)).toBe('1px');
      expect(computedValue(row, `border-${side}-style`)).toBe('solid');
    }
    expect(computedValue(nested, 'border-top-width')).toBe('0px');
    expect(computedValue(nested, 'padding-top')).toBe('0px');
  });

  // A projected control the box cannot see as a content child keeps its own
  // resolved skin; the box must still be the only painted element.
  it('paints no skin on a control that kept its own skin inside a box', () => {
    const input = query(mount(), '.projected-fill');
    expect(computedValue(input, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(input, 'border-bottom-width')).toBe('0px');
    expect(computedValue(input, 'box-shadow')).toBe('none');
  });

  it('fills a zero-padding table cell on the inline axis', () => {
    const root = mount();
    const cell = query(root, 'td');
    const input = query(root, '.cell-bare');
    expect(input.getBoundingClientRect().width).toBeCloseTo(cell.getBoundingClientRect().width, 0);
  });

  // WCAG 1.4.11: a non-text indicator needs >= 3:1 against what it sits on.
  // The fill skin trades the reset outline for this underline, so the ratio
  // is the whole a11y argument for the skin - it gets asserted, not assumed.
  // The two probes resolve the same var() fallback chains the skin uses, so
  // the measurement tracks a theme override instead of a hardcoded literal.
  it('holds 3:1 between the focus underline and the resting fill surface', () => {
    const root = mount();
    const surface = getComputedStyle(query(root, '.solo-fill')).backgroundColor;
    const underline = getComputedStyle(query(root, '.probe-underline')).backgroundColor;
    expect(contrast(surface, underline)).toBeGreaterThanOrEqual(3);
  });

  it.each(['light', 'dark'])('holds 3:1 at rest and on hover in the %s scheme', (scheme) => {
    const root = mount();
    const surface = getComputedStyle(query(root, `.fill-${scheme}`)).backgroundColor;
    const hover = getComputedStyle(query(root, `.probe-hover-${scheme}`)).backgroundColor;
    const underline = getComputedStyle(query(root, `.probe-underline-${scheme}`)).backgroundColor;
    expect(contrast(surface, underline)).toBeGreaterThanOrEqual(3);
    expect(contrast(hover, underline)).toBeGreaterThanOrEqual(3);
  });

  it('shows a bare error as tinted text, never as a line', () => {
    const root = mount();
    const invalid = query(root, '.bare-invalid');
    const valid = query(root, '.solo-bare');
    expect(computedValue(invalid, 'box-shadow')).toBe('none');
    expect(computedValue(invalid, 'border-bottom-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(invalid, 'color')).not.toBe(computedValue(valid, 'color'));
  });

  // A red mixed toward the bluish text colour in oklch walks the hue through
  // 360 and renders magenta; the error text has to stay red in both schemes.
  it.each(['.bare-invalid', '.bare-invalid-dark'])(
    'keeps the %s error text red, not magenta',
    (selector) => {
      const [r, g, b] = toRgb(getComputedStyle(query(mount(), selector)).color);
      // Red keeps blue level with green; the oklch hue walk lifts blue well
      // above green (light #9a3c6c, dark #eb89b7), which is what reads magenta.
      expect(r).toBeGreaterThan(g);
      expect(b - g).toBeLessThan(20);
    },
  );

  it('draws the bare rings inside the box and the focused error ring in danger', async () => {
    const root = mount();
    const invalid = query(root, '.bare-invalid') as HTMLInputElement;
    const danger = computedValue(invalid, 'outline-color');
    expect(computedValue(invalid, 'outline-offset')).toBe('-1px');
    invalid.focus();
    await settle();
    expect(computedValue(invalid, 'outline-width')).toBe('2px');
    expect(computedValue(invalid, 'outline-offset')).toBe('-2px');
    expect(computedValue(invalid, 'outline-color')).toBe(danger);
    const valid = query(root, '.solo-bare') as HTMLInputElement;
    valid.focus();
    await settle();
    expect(computedValue(valid, 'outline-offset')).toBe('-2px');
    expect(computedValue(valid, 'outline-color')).not.toBe(danger);
  });

  it('marks a disabled bare field with muted text and a dotted baseline, not opacity', () => {
    const root = mount();
    const disabled = query(root, '.bare-disabled');
    expect(computedValue(disabled, 'opacity')).toBe('1');
    expect(computedValue(disabled, 'border-bottom-style')).toBe('dotted');
    expect(computedValue(disabled, 'cursor')).toBe('not-allowed');
  });

  it('draws one bare error ring per affix row, on the row', () => {
    const root = mount();
    expect(computedValue(query(root, '.bare-row'), 'outline-style')).toBe('solid');
    expect(computedValue(query(root, '.bare-row-input'), 'outline-style')).toBe('none');
  });

  it('holds 3:1 on the hover surface, which is the worst case', () => {
    const root = mount();
    const hover = getComputedStyle(query(root, '.probe-hover')).backgroundColor;
    const underline = getComputedStyle(query(root, '.probe-underline')).backgroundColor;
    expect(contrast(hover, underline)).toBeGreaterThanOrEqual(3);
  });
});
