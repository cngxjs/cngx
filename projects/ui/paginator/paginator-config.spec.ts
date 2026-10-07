import { computed, Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import {
  CNGX_PAGINATOR_CONFIG,
  CNGX_PAGINATOR_DEFAULTS,
  injectPaginatorAnnouncements,
  injectPaginatorAriaLabels,
  injectPaginatorConfig,
  injectPaginatorFormats,
  provideCngxPaginatorConfig,
  provideCngxPaginatorConfigAt,
  withPaginatorAnnouncements,
  withPaginatorAriaLabels,
  withPaginatorPageSizeOptions,
  withPaginatorRangeFormat,
  type CngxPaginatorAriaLabels,
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
    const ariaLabels = runInInjectionContext(child, () => injectPaginatorAriaLabels());
    const announcements = runInInjectionContext(child, () => injectPaginatorAnnouncements());

    expect(config.pageSizeOptions).toEqual([5, 15]);
    // The scoped override changes only its own sub-tree; the parent's aria-label
    // and the default announcements survive the merge.
    expect(ariaLabels().next).toBe('Nächste Seite');
    expect(announcements().loading).toBe('Loading');
  });

  test('resolves plain overrides to the same bundles as the eager merge did', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxPaginatorConfig(
          withPaginatorAriaLabels({ next: 'Nächste Seite' }),
          withPaginatorAnnouncements({ loading: 'Lädt' }),
        ),
      ],
    });
    const ariaLabels = TestBed.runInInjectionContext(() => injectPaginatorAriaLabels());
    const announcements = TestBed.runInInjectionContext(() => injectPaginatorAnnouncements());
    expect(ariaLabels().next).toBe('Nächste Seite');
    expect(ariaLabels().previous).toBe('Previous page');
    expect(announcements().loading).toBe('Lädt');
    expect(announcements().updated).toBe('Updated');
  });

  test('follows Signal overrides and keeps the bundle reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideCngxPaginatorConfig(
          withPaginatorAriaLabels(
            computed<Partial<CngxPaginatorAriaLabels>>(() =>
              lang() === 'en' ? {} : { next: 'Nächste Seite' },
            ),
          ),
          withPaginatorRangeFormat(
            computed(() =>
              lang() === 'en'
                ? (start: number, end: number, total: number) => `${start}-${end} of ${total}`
                : (start: number, end: number, total: number) => `${start}-${end} von ${total}`,
            ),
          ),
        ),
      ],
    });
    const ariaLabels = TestBed.runInInjectionContext(() => injectPaginatorAriaLabels());
    const formats = TestBed.runInInjectionContext(() => injectPaginatorFormats());
    expect(ariaLabels().next).toBe('Next page');
    expect(formats().range(1, 10, 95)).toBe('1-10 of 95');

    lang.set('de');
    const german = ariaLabels();
    expect(german.next).toBe('Nächste Seite');
    expect(german.previous).toBe('Previous page');
    expect(formats().range(1, 10, 95)).toBe('1-10 von 95');

    lang.set('de-AT');
    expect(ariaLabels()).toBe(german);
  });
});
