import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CngxPaginator,
  CngxPaginatorFirst,
  CngxPaginatorGoto,
  CngxPaginatorLast,
  CngxPaginatorLoadMore,
  CngxPaginatorNext,
  CngxPaginatorPageOfPages,
  CngxPaginatorPageSize,
  CngxPaginatorPages,
  CngxPaginatorPrev,
  CngxPaginatorRange,
  CngxPaginatorStatus,
} from '@cngx/ui/paginator';

// Runs in a real Chromium (the `test-geometry` target). The default `numbered`
// skin is used deliberately: the `bar` skin opts out of inline-size containment.
//
// FINDING (fixed): the two bare-element collapse rules `cngx-pgn-goto` (0,0,1)
// and `cngx-pgn-first, cngx-pgn-last` (0,0,1) were specificity-outranked in the
// SAME `@layer cngx.components` by `.cngx-paginator__segment { display:
// inline-flex }` (paginator-base.css:114, 0,1,0), so the container query matched
// but the segment never hid. Fixed by qualifying the collapse selectors with the
// segment class - `.cngx-paginator__segment:is(cngx-pgn-goto)` and
// `.cngx-paginator__segment:is(cngx-pgn-first, cngx-pgn-last)` - which reach
// (0,1,1) and win. The two guards below now assert the collapse for real. The
// The page-row swap (now unconditional, gated only on the negated
// `--cngx-paginator-collapse` style query) is the positive control proving the
// query itself fires.

@Component({
  selector: 'cngx-paginator-geometry-host',
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorStatus,
    CngxPaginatorNext,
    CngxPaginatorLast,
    CngxPaginatorGoto,
  ],
  template: `
    <cngx-paginator aria-label="Pager" [total]="100" [pageIndex]="3" [pageSize]="10">
      <cngx-pgn-first />
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-status />
      <cngx-pgn-next />
      <cngx-pgn-last />
      <cngx-pgn-goto />
    </cngx-paginator>
  `,
})
class PaginatorHost {}

let mountedRoot: HTMLElement | null = null;

function mount(width: number): HTMLElement {
  const fixture = TestBed.createComponent(PaginatorHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-paginator');
  if (!host) {
    throw new Error('cngx-paginator did not render');
  }
  (host as HTMLElement).style.inlineSize = `${width}px`;
  return host as HTMLElement;
}

function segmentDisplay(host: HTMLElement, selector: string): string {
  const el = host.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return computedValue(el, 'display');
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxPaginator geometry', () => {
  it('declares an inline-size container named cngx-paginator', () => {
    const host = mount(800);
    const state = containerState(host);
    expect(state.type).toBe('inline-size');
    expect(state.name).toBe('cngx-paginator');
  });

  it('swaps the page row for the status readout below the 30rem rung', () => {
    // Positive control: proves the @container query fires. The swap selectors
    // carry enough specificity to win, which the two collapse guards below now
    // assert for the goto/first/last rules as well.
    const host = mount(800);
    expect(segmentDisplay(host, 'cngx-pgn-pages')).not.toBe('none');
    expect(segmentDisplay(host, 'cngx-pgn-status')).toBe('none');
    host.style.inlineSize = '430px';
    expect(segmentDisplay(host, 'cngx-pgn-pages')).toBe('none');
    expect(segmentDisplay(host, 'cngx-pgn-status')).not.toBe('none');
  });

  it('keeps the full number row when --cngx-paginator-collapse is none', () => {
    // The opt-out is a style query, not a display restore: with the property
    // set, the swap block never applies, so the page row keeps whatever
    // display it had and the status segment stays hidden.
    const host = mount(430);
    expect(segmentDisplay(host, 'cngx-pgn-pages')).toBe('none');

    host.style.setProperty('--cngx-paginator-collapse', 'none');
    expect(segmentDisplay(host, 'cngx-pgn-pages')).not.toBe('none');
    expect(segmentDisplay(host, 'cngx-pgn-status')).toBe('none');
  });

  it('collapses the go-to input below the 30rem rung', () => {
    const host = mount(430);
    expect(segmentDisplay(host, 'cngx-pgn-goto')).toBe('none');
  });

  it('collapses first/last below the 20rem rung', () => {
    const host = mount(300);
    expect(segmentDisplay(host, 'cngx-pgn-first')).toBe('none');
    expect(segmentDisplay(host, 'cngx-pgn-last')).toBe('none');
  });
});

// ── RTL bidi isolation of the numeric readouts (paginator-base.css) ──────────

@Component({
  selector: 'cngx-paginator-rtl-host',
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorRange,
    CngxPaginatorStatus,
    CngxPaginatorLoadMore,
    CngxPaginatorPageOfPages,
  ],
  template: `
    <cngx-paginator aria-label="Pager" [total]="100" [pageIndex]="0" [pageSize]="10">
      <cngx-pgn-range />
      <cngx-pgn-status />
      <cngx-pgn-load-more />
      <cngx-pgn-page-of-pages />
    </cngx-paginator>
  `,
})
class PaginatorRtlHost {}

function mountRtl(): HTMLElement {
  const fixture = TestBed.createComponent(PaginatorRtlHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-paginator');
  if (!host) {
    throw new Error('cngx-paginator did not render');
  }
  return host as HTMLElement;
}

function readout(host: HTMLElement, selector: string): HTMLElement {
  const el = host.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

describe('CngxPaginator numeric readouts isolate under dir=rtl', () => {
  it('pins range / load-more / page-of-pages to isolate + direction:ltr', () => {
    document.documentElement.dir = 'rtl';
    const host = mountRtl();

    // `1-10 of 100`, `40 / 100`, `1 / 10` are number groups joined by a neutral
    // separator that invert under RTL; direction:ltr is what actually gates the
    // `2 / 9 -> 9 / 2` reorder (vacuous without the rtl mount).
    const range = readout(host, '.cngx-paginator__range');
    expect(computedValue(range, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(range, 'direction')).toBe('ltr');

    const loadMore = readout(host, '.cngx-paginator__load-more-count');
    expect(computedValue(loadMore, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(loadMore, 'direction')).toBe('ltr');

    const selectLabel = readout(host, '.cngx-paginator__select-label');
    expect(computedValue(selectLabel, 'unicode-bidi')).toBe('isolate');
    expect(computedValue(selectLabel, 'direction')).toBe('ltr');
  });

  it('isolates the word-anchored status readout (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const host = mountRtl();
    // `Page n of m` carries its order in the words; isolate-only fences the
    // boundary without pinning direction.
    const status = readout(host, '.cngx-paginator__status');
    expect(computedValue(status, 'unicode-bidi')).toBe('isolate');
  });
});

// ── Default glyphs from the shared icon set (paginator.component.css) ─────────

@Component({
  selector: 'cngx-paginator-glyph-host',
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
    CngxPaginatorPageSize,
    CngxPaginatorPageOfPages,
  ],
  template: `
    <cngx-paginator
      aria-label="Pager"
      style="color: rgb(0, 128, 0)"
      [total]="100"
      [pageIndex]="0"
      [pageSize]="10"
    >
      <cngx-pgn-first />
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-next />
      <cngx-pgn-last />
      <cngx-pgn-page-size />
      <cngx-pgn-page-of-pages />
    </cngx-paginator>
  `,
})
class PaginatorGlyphHost {}

function mountGlyphs(): HTMLElement {
  const fixture = TestBed.createComponent(PaginatorGlyphHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('cngx-paginator');
  if (!host) {
    throw new Error('cngx-paginator did not render');
  }
  (host as HTMLElement).style.inlineSize = '800px';
  return host as HTMLElement;
}

interface GlyphParts {
  readonly button: HTMLElement;
  readonly svg: SVGSVGElement;
  readonly path: SVGPathElement;
}

function glyph(host: HTMLElement, selector: string): GlyphParts {
  const svg = host.querySelector<SVGSVGElement>(`${selector} svg.cngx-icon-svg`);
  const path = svg?.querySelector('path');
  const button = svg?.closest<HTMLElement>('button');
  if (!svg || !path || !button) {
    throw new Error(`${selector} renders no default icon`);
  }
  return { button, svg, path };
}

function px(el: Element, property: string): number {
  return parseFloat(computedValue(el, property));
}

// The drawn extent of a stroke icon includes half the stroke on each side;
// the path box alone is the geometric centre line.
function strokePx(svg: SVGSVGElement): number {
  return svg.classList.contains('cngx-icon-svg--stroke')
    ? (px(svg, 'stroke-width') * svg.getBoundingClientRect().width) / 24
    : 0;
}

function centreOffset(parts: GlyphParts): { readonly x: number; readonly y: number } {
  const ink = parts.path.getBoundingClientRect();
  const box = parts.button.getBoundingClientRect();
  return {
    x: ink.left + ink.width / 2 - (box.left + box.width / 2),
    y: ink.top + ink.height / 2 - (box.top + box.height / 2),
  };
}

const NAV_SEGMENTS = ['cngx-pgn-first', 'cngx-pgn-prev', 'cngx-pgn-next', 'cngx-pgn-last'];
const CARET_SEGMENTS = ['cngx-pgn-page-size', 'cngx-pgn-page-of-pages'];

describe('CngxPaginator default glyphs', () => {
  // The text chevrons drew 0.41em tall in the cngx-icon font; the chevron
  // icons span 14 of 24 units with stroke, scaled by 24/14 to match.
  it.each(NAV_SEGMENTS)('draws the %s chevron 0.41em of the icon font tall', (selector) => {
    const parts = glyph(mountGlyphs(), selector);
    const icon = parts.svg.closest('.cngx-icon');
    if (!icon) {
      throw new Error(`${selector} renders its svg outside cngx-icon`);
    }
    const drawn = parts.path.getBoundingClientRect().height + strokePx(parts.svg);
    expect(drawn).toBeCloseTo(0.41 * px(icon, 'font-size'), 1);
  });

  it('draws the ellipsis 0.63em of the button font wide', () => {
    const parts = glyph(mountGlyphs(), '.cngx-paginator__more');
    expect(parts.path.getBoundingClientRect().width).toBeCloseTo(
      0.63 * px(parts.button, 'font-size'),
      1,
    );
  });

  it.each(CARET_SEGMENTS)('draws the %s caret 0.4em of the caret font wide', (selector) => {
    const parts = glyph(mountGlyphs(), `${selector} .cngx-paginator__select-caret`);
    const caret = parts.svg.parentElement;
    if (!caret) {
      throw new Error(`${selector} caret svg has no parent`);
    }
    expect(parts.path.getBoundingClientRect().width).toBeCloseTo(0.4 * px(caret, 'font-size'), 1);
  });

  it.each([...NAV_SEGMENTS, '.cngx-paginator__more'])(
    'centres the %s glyph in its button',
    (selector) => {
      const offset = centreOffset(glyph(mountGlyphs(), selector));
      expect(Math.abs(offset.x)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(offset.y)).toBeLessThanOrEqual(0.5);
    },
  );

  // The caret trails the value, so only its vertical position is centred.
  it.each(CARET_SEGMENTS)('centres the %s caret on the trigger middle', (selector) => {
    const offset = centreOffset(glyph(mountGlyphs(), `${selector} .cngx-paginator__select-caret`));
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(0.5);
  });

  it('paints every glyph in currentColor', () => {
    const host = mountGlyphs();
    for (const selector of NAV_SEGMENTS) {
      const parts = glyph(host, selector);
      expect(computedValue(parts.svg, 'stroke')).toBe(computedValue(parts.button, 'color'));
      expect(computedValue(parts.svg, 'fill')).toBe('none');
    }
    const fills = [
      glyph(host, '.cngx-paginator__more'),
      ...CARET_SEGMENTS.map((s) => glyph(host, `${s} .cngx-paginator__select-caret`)),
    ];
    for (const parts of fills) {
      expect(computedValue(parts.svg, 'fill')).toBe(computedValue(parts.svg, 'color'));
    }
  });

  // The svg chevrons draw LTR-pointing and carry no bidi glyph mirroring, so
  // the :dir(rtl) flip alone turns them toward the RTL start / end.
  it('mirrors the nav chevrons under dir=rtl only', () => {
    const ltr = mountGlyphs();
    for (const selector of NAV_SEGMENTS) {
      const icon = glyph(ltr, selector).svg.closest('.cngx-icon');
      expect(icon && computedValue(icon, 'transform')).toBe('none');
    }
    mountedRoot?.remove();

    document.documentElement.dir = 'rtl';
    const rtl = mountGlyphs();
    for (const selector of NAV_SEGMENTS) {
      const icon = glyph(rtl, selector).svg.closest('.cngx-icon');
      expect(icon && computedValue(icon, 'transform')).toBe('matrix(-1, 0, 0, 1, 0, 0)');
    }
  });
});
