import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
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
    '../../../core/theming/base.css',
    './cngx-field-skin.css',
    './cngx-field-affix.css',
    '../../select/shared/select-base.css',
    './cngx-field-text.css',
  ],
  encapsulation: ViewEncapsulation.None,
  // cngx-field-errors is probed as a plain element: the typography keys on the
  // element name, and the component would need a form field around it.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
        color-mix(in oklab, var(--cngx-color-text) 5%, var(--cngx-field-fill-bg))
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
      <input class="fill-light" type="text" data-skin="fill" placeholder="Search" />
      <input class="fill-invalid-light" type="text" data-skin="fill" aria-invalid="true" />
      <input class="bare-light" type="text" data-skin="bare" placeholder="Search" />
      <input class="bare-invalid-light" type="text" data-skin="bare" aria-invalid="true" />
      <span class="probe-page-light" style="background: var(--cngx-color-surface)"></span>
      <input class="outline-light" type="text" value="Value" />
      <input class="outline-disabled-light" type="text" value="Value" disabled />
      <span class="cngx-field-box cngx-field-affix-row outline-box-disabled-light" data-skin="outline">
        <span class="cngx-field-prefix">$</span>
        <input type="text" data-skin="bare" value="Value" disabled />
      </span>
      <label class="cngx-label label-light">Name</label>
      <label class="cngx-label cngx-label--error label-error-light">Name</label>
      <span class="cngx-hint hint-light">Hint</span>
      <cngx-field-errors class="errors-light"><p>Required.</p></cngx-field-errors>
      <div class="cngx-error error-light">Required.</div>
      <span
        class="probe-select-placeholder-light"
        style="background: var(--cngx-select-placeholder-color)"
      ></span>
      <span
        class="probe-underline-light"
        style="background: var(--cngx-field-underline-focus-color)"
      ></span>
      <span
        class="probe-hover-light"
        style="background: var(
          --cngx-field-fill-bg-hover,
          color-mix(in oklab, var(--cngx-color-text) 5%, var(--cngx-field-fill-bg))
        )"
      ></span>
    </div>
    <div data-color-scheme="dark">
      <input class="fill-dark" type="text" data-skin="fill" placeholder="Search" />
      <input class="fill-invalid-dark" type="text" data-skin="fill" aria-invalid="true" />
      <input class="bare-dark" type="text" data-skin="bare" placeholder="Search" />
      <input class="bare-invalid-dark" type="text" data-skin="bare" aria-invalid="true" />
      <span class="probe-page-dark" style="background: var(--cngx-color-surface)"></span>
      <input class="outline-dark" type="text" value="Value" />
      <input class="outline-disabled-dark" type="text" value="Value" disabled />
      <span class="cngx-field-box cngx-field-affix-row outline-box-disabled-dark" data-skin="outline">
        <span class="cngx-field-prefix">$</span>
        <input type="text" data-skin="bare" value="Value" disabled />
      </span>
      <label class="cngx-label label-dark">Name</label>
      <label class="cngx-label cngx-label--error label-error-dark">Name</label>
      <span class="cngx-hint hint-dark">Hint</span>
      <cngx-field-errors class="errors-dark"><p>Required.</p></cngx-field-errors>
      <div class="cngx-error error-dark">Required.</div>
      <span
        class="probe-select-placeholder-dark"
        style="background: var(--cngx-select-placeholder-color)"
      ></span>
      <span
        class="probe-underline-dark"
        style="background: var(--cngx-field-underline-focus-color)"
      ></span>
      <span
        class="probe-hover-dark"
        style="background: var(
          --cngx-field-fill-bg-hover,
          color-mix(in oklab, var(--cngx-color-text) 5%, var(--cngx-field-fill-bg))
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
function toRgb(color: string, underlay = '#fff'): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  // White underlay so a translucent surface composites the way it renders on
  // the page, which is what the contrast ratio has to be measured against.
  ctx.fillStyle = underlay;
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

function contrast(a: string, b: string, underlay?: string): number {
  const la = relativeLuminance(toRgb(a, underlay));
  const lb = relativeLuminance(toRgb(b, underlay));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Legibility floor for disabled value text. Not a WCAG number (1.4.3 exempts
// inactive controls); it keeps the value readable at the 38% recipe.
const DISABLED_TEXT_FLOOR = 2;

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
    // 1px border plus a 1px shadow: the 2px underline is one line in one
    // colour, the resting border never shows under the focus colour.
    const shadow = computedValue(input, 'box-shadow');
    expect(shadow).toContain('-1px');
    expect(shadow).toContain(computedValue(input, 'border-bottom-color'));
    expect(computedValue(input, 'outline-style')).toBe('none');
  });

  it('keeps the 2px danger underline on an invalid fill field while focused', async () => {
    const root = mount();
    const invalid = query(root, '.fill-invalid') as HTMLInputElement;
    const danger = computedValue(invalid, 'border-bottom-color');
    invalid.focus();
    await settle();
    const shadow = computedValue(invalid, 'box-shadow');
    expect(shadow).toContain('-1px');
    expect(shadow).toContain(danger);
    expect(computedValue(invalid, 'border-bottom-color')).toBe(danger);
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

  // The contrast ratchet: every colour recipe of the fill and bare skins,
  // measured in both schemes against the surface it sits on. Non-text
  // indicators need 3:1 (WCAG 1.4.11), text needs 4.5:1 (1.4.3). Disabled is
  // left out on purpose: 1.4.3 exempts inactive components.
  describe.each(['light', 'dark'])('contrast ratchet, %s scheme', (scheme) => {
    function colours(root: HTMLElement): { surface: string; hover: string; page: string } {
      return {
        surface: getComputedStyle(query(root, `.fill-${scheme}`)).backgroundColor,
        hover: getComputedStyle(query(root, `.probe-hover-${scheme}`)).backgroundColor,
        page: getComputedStyle(query(root, `.probe-page-${scheme}`)).backgroundColor,
      };
    }

    it('holds 3:1 for the resting underline on the resting and the hover surface', () => {
      const root = mount();
      const { surface, hover } = colours(root);
      const underline = computedValue(query(root, `.fill-${scheme}`), 'border-bottom-color');
      expect(contrast(surface, underline)).toBeGreaterThanOrEqual(3);
      expect(contrast(hover, underline)).toBeGreaterThanOrEqual(3);
    });

    it('holds 3:1 for the error underline on the fill surface', () => {
      const root = mount();
      const { surface } = colours(root);
      const error = computedValue(query(root, `.fill-invalid-${scheme}`), 'border-bottom-color');
      expect(contrast(surface, error)).toBeGreaterThanOrEqual(3);
    });

    it('holds 4.5:1 for the placeholder on the fill surface and on the page', () => {
      const root = mount();
      const { surface, page } = colours(root);
      const fill = getComputedStyle(query(root, `.fill-${scheme}`), '::placeholder').color;
      const bare = getComputedStyle(query(root, `.bare-${scheme}`), '::placeholder').color;
      expect(contrast(surface, fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(page, bare)).toBeGreaterThanOrEqual(4.5);
    });

    it('holds 4.5:1 for the select placeholder on the fill surface and on the page', () => {
      const root = mount();
      const { surface, page } = colours(root);
      const placeholder = getComputedStyle(
        query(root, `.probe-select-placeholder-${scheme}`),
      ).backgroundColor;
      expect(contrast(surface, placeholder)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(page, placeholder)).toBeGreaterThanOrEqual(4.5);
    });

    it('holds 4.5:1 for the bare error text on the page', () => {
      const root = mount();
      const { page } = colours(root);
      const text = computedValue(query(root, `.bare-invalid-${scheme}`), 'color');
      expect(contrast(page, text)).toBeGreaterThanOrEqual(4.5);
    });

    // An inner label sits on the fill surface, hovered or not; an outer one
    // on the page.
    it('holds 4.5:1 for the label and the hint on the page and the fill surfaces', () => {
      const root = mount();
      const { surface, hover, page } = colours(root);
      const label = computedValue(query(root, `.label-${scheme}`), 'color');
      const hint = computedValue(query(root, `.hint-${scheme}`), 'color');
      for (const ground of [page, surface, hover]) {
        expect(contrast(ground, label)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(page, hint)).toBeGreaterThanOrEqual(4.5);
    });

    it('holds 4.5:1 for the error label and the error list on the page and the fill surfaces', () => {
      const root = mount();
      const { surface, hover, page } = colours(root);
      const label = computedValue(query(root, `.label-error-${scheme}`), 'color');
      const list = computedValue(query(root, `.errors-${scheme} p`), 'color');
      const manual = computedValue(query(root, `.error-${scheme}`), 'color');
      for (const ground of [page, surface, hover]) {
        expect(contrast(ground, label)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(page, list)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(page, manual)).toBeGreaterThanOrEqual(4.5);
      expect(manual).toBe(list);
    });

    // 1.4.3 exempts a disabled control, so this ratchet pins distinctness
    // instead of a floor: the disabled value text of a lone outline control
    // and of an outline box reads clearly fainter than the resting value, and
    // stays above a legibility floor on its own tinted surface.
    it('fades disabled outline value text below the resting value, above the floor', () => {
      const root = mount();
      const { page } = colours(root);
      const resting = computedValue(query(root, `.outline-${scheme}`), 'color');
      const restingRatio = contrast(page, resting, page);
      for (const selector of [`.outline-disabled-${scheme}`, `.outline-box-disabled-${scheme}`]) {
        const el = query(root, selector);
        const surface = computedValue(el, 'background-color');
        const text = computedValue(el, 'color');
        // Text and surface are both translucent: composite the surface on the
        // page first, then measure the text on that.
        const ground = `rgb(${toRgb(surface, page).join(' ')})`;
        const ratio = contrast(ground, text, ground);
        expect(ratio).toBeLessThan(restingRatio / 2);
        expect(ratio).toBeGreaterThanOrEqual(DISABLED_TEXT_FLOOR);
      }
    });
  });

  it('sets the label, hint and both error surfaces at 13px', () => {
    const root = mount();
    for (const selector of ['.label-light', '.hint-light', '.errors-light p', '.error-light']) {
      expect(computedValue(query(root, selector), 'font-size')).toBe('13px');
    }
    expect(computedValue(query(root, '.label-light'), 'font-weight')).toBe('500');
  });

  // The hover surface is a text mix of the resting one; too strong a mix
  // pushes the muted placeholder under the 4.5:1 text floor while hovered.
  it.each(['light', 'dark'])('keeps the placeholder at 4.5:1 on the %s hover surface', (scheme) => {
    const root = mount();
    const hover = getComputedStyle(query(root, `.probe-hover-${scheme}`)).backgroundColor;
    const placeholder = getComputedStyle(query(root, `.fill-${scheme}`), '::placeholder').color;
    expect(contrast(hover, placeholder)).toBeGreaterThanOrEqual(4.5);
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

  it('marks a disabled outline control and outline box with a dashed border, not opacity', () => {
    const root = mount();
    for (const selector of ['.outline-disabled-light', '.outline-box-disabled-light']) {
      const el = query(root, selector);
      expect(computedValue(el, 'opacity')).toBe('1');
      for (const side of ['top', 'right', 'bottom', 'left']) {
        expect(computedValue(el, `border-${side}-style`)).toBe('dashed');
      }
      expect(computedValue(el, 'cursor')).toBe('not-allowed');
    }
    expect(computedValue(query(root, '.outline-light'), 'border-top-style')).toBe('solid');
    // The prefix keeps its own muted colour; only the value fades.
    const box = query(root, '.outline-box-disabled-light');
    expect(computedValue(query(box, '.cngx-field-prefix'), 'color')).not.toBe(
      computedValue(box, 'color'),
    );
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
