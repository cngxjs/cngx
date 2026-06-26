import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import {
  CNGX_PAGINATOR_CONFIG,
  CNGX_PAGINATOR_DEFAULTS,
  injectPaginatorConfig,
  provideCngxPaginatorConfig,
  provideCngxPaginatorConfigAt,
  withPaginatorAriaLabels,
  withPaginatorPageSizeOptions,
} from './paginator-config';

describe('paginator page-size options cascade', () => {
  test('the library default ships a sensible size ladder including the brain default (10)', () => {
    expect(CNGX_PAGINATOR_DEFAULTS.pageSizeOptions).toEqual([10, 25, 50, 100]);
  });

  test('withPaginatorPageSizeOptions replaces the default list wholesale at the root', () => {
    TestBed.configureTestingModule({
      providers: [provideCngxPaginatorConfig(withPaginatorPageSizeOptions([20, 40]))],
    });
    const config = TestBed.inject(CNGX_PAGINATOR_CONFIG);
    expect(config.pageSizeOptions).toEqual([20, 40]);
    // Replace, not merge: no leftover members from the default ladder.
    expect(config.pageSizeOptions).not.toContain(100);
  });

  test('an empty feature list leaves the default config reference untouched', () => {
    TestBed.configureTestingModule({ providers: [provideCngxPaginatorConfig()] });
    expect(TestBed.inject(CNGX_PAGINATOR_CONFIG)).toBe(CNGX_PAGINATOR_DEFAULTS);
  });

  test('provideCngxPaginatorConfigAt merges onto the parent, leaving other sub-trees intact', () => {
    TestBed.configureTestingModule({
      providers: [provideCngxPaginatorConfig(withPaginatorAriaLabels({ next: 'Nächste Seite' }))],
    });
    const parent = TestBed.inject(Injector);

    const child = Injector.create({
      providers: provideCngxPaginatorConfigAt(withPaginatorPageSizeOptions([5, 15])),
      parent,
    });
    const config = runInInjectionContext(child, () => injectPaginatorConfig());

    expect(config.pageSizeOptions).toEqual([5, 15]);
    // The scoped override changes only its own sub-tree; the parent's aria-label
    // and the default announcements survive the merge.
    expect(config.ariaLabels.next).toBe('Nächste Seite');
    expect(config.announcements.loading).toBe('Loading');
  });
});
