import { Component, provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBucketPaginate } from '@cngx/common/data';

import { CngxPaginator } from '../paginator.component';
import { CngxPaginatorAlpha } from './paginator-alpha.component';
import { CngxPaginatorDots } from './paginator-dots.component';
import { CngxPaginatorGoto } from './paginator-goto.component';
import { CngxPaginatorInfinite } from './paginator-infinite.component';
import { CngxPaginatorLoadMore } from './paginator-load-more.component';
import {
  CngxPaginatorFirst,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPrev,
} from './paginator-nav.component';
import { CngxPaginatorPageOfPages } from './paginator-page-of-pages.component';
import { CngxPaginatorPageSize } from './paginator-page-size.component';
import { CngxPaginatorPages } from './paginator-pages.component';
import { CngxPaginatorRail } from './paginator-rail.component';
import { CngxPaginatorRange } from './paginator-range.component';
import { CngxPaginatorStatus } from './paginator-status.component';

const SEGMENTS: readonly (readonly [string, Type<unknown>])[] = [
  ['cngx-pgn-dots', CngxPaginatorDots],
  ['cngx-pgn-goto', CngxPaginatorGoto],
  ['cngx-pgn-infinite', CngxPaginatorInfinite],
  ['cngx-pgn-load-more', CngxPaginatorLoadMore],
  ['cngx-pgn-first', CngxPaginatorFirst],
  ['cngx-pgn-prev', CngxPaginatorPrev],
  ['cngx-pgn-next', CngxPaginatorNext],
  ['cngx-pgn-last', CngxPaginatorLast],
  ['cngx-pgn-page-of-pages', CngxPaginatorPageOfPages],
  ['cngx-pgn-page-size', CngxPaginatorPageSize],
  ['cngx-pgn-pages', CngxPaginatorPages],
  ['cngx-pgn-rail', CngxPaginatorRail],
  ['cngx-pgn-range', CngxPaginatorRange],
  ['cngx-pgn-status', CngxPaginatorStatus],
];

@Component({
  standalone: true,
  imports: [CngxPaginator, CngxPaginatorRange],
  template: `<cngx-paginator [total]="40"><cngx-pgn-range /></cngx-paginator>`,
})
class PlacedHost {}

@Component({
  standalone: true,
  imports: [CngxBucketPaginate, CngxPaginatorAlpha],
  template: `<div cngxBucketPaginate [buckets]="[]"><cngx-pgn-alpha /></div>`,
})
class PlacedAlphaHost {}

describe('paginator segment placement (CNGX3018)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it.each(SEGMENTS)('throws CNGX3018 for <%s> outside a paginator', (selector, segment) => {
    expect(() => TestBed.createComponent(segment)).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX3018',
        message: expect.stringMatching(
          new RegExp(
            `^CNGX3018: \\[${selector}\\] must be placed inside <cngx-paginator> or <cngx-incremental-list>\\.`,
          ),
        ),
      }),
    );
  });

  it('throws CNGX3018 for <cngx-pgn-alpha> outside [cngxBucketPaginate]', () => {
    expect(() => TestBed.createComponent(CngxPaginatorAlpha)).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX3018',
        message: expect.stringMatching(
          /^CNGX3018: \[cngx-pgn-alpha\] must be placed inside an element with \[cngxBucketPaginate\]\./,
        ),
      }),
    );
  });

  it('does not throw for a segment inside <cngx-paginator>', () => {
    const fixture = TestBed.createComponent(PlacedHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('cngx-pgn-range')).not.toBeNull();
  });

  it('does not throw for <cngx-pgn-alpha> inside [cngxBucketPaginate]', () => {
    const fixture = TestBed.createComponent(PlacedAlphaHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('cngx-pgn-alpha')).not.toBeNull();
  });
});
