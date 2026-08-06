import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, containerState } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CngxPaginator,
  CngxPaginatorFirst,
  CngxPaginatorGoto,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPages,
  CngxPaginatorPrev,
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
// `[data-responsive]` swap (its selectors carry `.cngx-paginator[data-responsive]`,
// specificity 0,2,1) is the positive control proving the query itself fires.

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
    <cngx-paginator aria-label="Pager" [responsive]="true" [total]="100" [pageIndex]="3" [pageSize]="10">
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
});

describe('CngxPaginator geometry', () => {
  it('declares an inline-size container named cngx-paginator', () => {
    const host = mount(800);
    const state = containerState(host);
    expect(state.type).toBe('inline-size');
    expect(state.name).toBe('cngx-paginator');
  });

  it('swaps the page row for the status readout below the 24rem breakpoint', () => {
    // Positive control: proves the @container query fires. The responsive-swap
    // selectors carry enough specificity to win, unlike the bare-element rules
    // exercised by the two `it.fails` guards below.
    const host = mount(800);
    expect(segmentDisplay(host, 'cngx-pgn-pages')).not.toBe('none');
    expect(segmentDisplay(host, 'cngx-pgn-status')).toBe('none');
    host.style.inlineSize = '300px';
    expect(segmentDisplay(host, 'cngx-pgn-pages')).toBe('none');
    expect(segmentDisplay(host, 'cngx-pgn-status')).not.toBe('none');
  });

  it('collapses the go-to input below the 30rem breakpoint', () => {
    const host = mount(430);
    expect(segmentDisplay(host, 'cngx-pgn-goto')).toBe('none');
  });

  it('collapses first/last below the 24rem breakpoint', () => {
    const host = mount(300);
    expect(segmentDisplay(host, 'cngx-pgn-first')).toBe('none');
    expect(segmentDisplay(host, 'cngx-pgn-last')).toBe('none');
  });
});
