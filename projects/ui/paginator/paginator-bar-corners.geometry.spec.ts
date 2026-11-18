import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CngxPaginator,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPageSize,
  CngxPaginatorPages,
  CngxPaginatorPrev,
} from '@cngx/ui/paginator';

// Runs in a real Chromium (the `test-geometry` target). The bar skin rounds its
// enclosure but squares its cells; the cells at both ends must trace the
// enclosure corner, or their focus ring and fills cut it square. The shell
// appends its own nodes (live region) after the segments, so the end cell is
// not the last child.

@Component({
  selector: 'cngx-paginator-bar-corners-host',
  standalone: true,
  imports: [
    CngxPaginator,
    CngxPaginatorPageSize,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
  ],
  template: `
    <cngx-paginator
      skin="bar"
      [total]="240"
      [pageIndex]="1"
      style="--cngx-paginator-bar-radius: 9px"
    >
      <cngx-pgn-page-size [options]="[10, 20]" />
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-next />
      <cngx-pgn-last />
    </cngx-paginator>
  `,
})
class BarHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(BarHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function radii(el: Element): string[] {
  const cs = getComputedStyle(el);
  return [
    cs.borderTopLeftRadius,
    cs.borderTopRightRadius,
    cs.borderBottomRightRadius,
    cs.borderBottomLeftRadius,
  ];
}

describe('paginator bar skin end cells', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('rounds the outer corners of the first and last cell to the bar radius minus its border', () => {
    const root = mount();
    const first = root.querySelector('cngx-pgn-page-size .cngx-paginator__button')!;
    const last = root.querySelector('cngx-pgn-last .cngx-paginator__button')!;
    expect(radii(first)).toEqual(['8px', '0px', '0px', '8px']);
    expect(radii(last)).toEqual(['0px', '8px', '8px', '0px']);
  });

  it('keeps the inner cells square', () => {
    const root = mount();
    for (const el of Array.from(
      root.querySelectorAll('cngx-pgn-prev .cngx-paginator__button, .cngx-paginator__page'),
    )) {
      expect(radii(el)).toEqual(['0px', '0px', '0px', '0px']);
    }
  });
});
