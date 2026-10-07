import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';

import {
  CNGX_PAGINATOR_CONFIG,
  CNGX_PAGINATOR_DEFAULTS,
  injectPaginatorAnnouncements,
  injectPaginatorAriaLabels,
  injectPaginatorFormats,
  provideCngxPaginatorConfig,
  withPaginatorAriaLabels,
  withPaginatorRangeFormat,
} from '../paginator-config';
import { CNGX_PAGINATOR_LANGUAGE_EN } from './paginator-language-section';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['paginator'] = CNGX_PAGINATOR_LANGUAGE_EN;

function read() {
  return TestBed.runInInjectionContext(() => ({
    ariaLabels: injectPaginatorAriaLabels(),
    announcements: injectPaginatorAnnouncements(),
    formats: injectPaginatorFormats(),
  }));
}

describe('paginator language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English copy from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const { ariaLabels, announcements, formats } = read();
    const aria = ariaLabels();
    expect(aria.label).toBe('Pagination');
    expect(aria.first).toBe('First page');
    expect(aria.previous).toBe('Previous page');
    expect(aria.next).toBe('Next page');
    expect(aria.last).toBe('Last page');
    expect(aria.page(3)).toBe('Page 3');
    expect(aria.morePages).toBe('More pages');
    expect(aria.itemsPerPage).toBe('Items per page');
    expect(aria.goToPage).toBe('Go to page');
    expect(aria.pageOfPages).toBe('Select page');
    expect(aria.loadMore).toBe('Load more');
    expect(aria.allLoaded(42)).toBe('All 42 loaded');
    expect(stripBidiIsolates(aria.bucket('A-C'))).toBe('A-C');
    expect(stripBidiIsolates(aria.emptyBucket('D-F'))).toBe('D-F, no items');
    expect(aria.bucketGroup).toBe('Categories');
    expect(aria.railPosition).toBe('Page position');
    expect(announcements().pageChange(2, 9)).toBe('Page 2 of 9');
    expect(announcements().loading).toBe('Loading');
    expect(announcements().updated).toBe('Updated');
    expect(formats().range(1, 10, 95)).toBe('<b>1-10</b> of 95');
    expect(formats().pageStatus(2, 9)).toBe('Page <b>2</b> of 9');
    expect(formats().pageOfPagesReadout(2, 9)).toBe('<b>2</b> / 9');
    expect(formats().loadMoreReadout(20, 95)).toBe('20 / 95');
    expect(EN_SECTION.range).toBe('<b>{start}-{end}</b> of {total}');
  });

  it('carries no copy on the default config, so the section is the default', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const config = TestBed.inject(CNGX_PAGINATOR_CONFIG);
    expect(config).toBe(CNGX_PAGINATOR_DEFAULTS);
    expect(config.ariaLabels).toBeUndefined();
    expect(config.announcements).toBeUndefined();
    expect(config.formats).toBeUndefined();
  });

  it('formats the numbers in the locale (behaviour change: grouped digits)', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const { announcements, formats } = read();
    expect(formats().range(1001, 1010, 12500)).toBe('<b>1,001-1,010</b> of 12,500');
    expect(announcements().pageChange(2, 1250)).toBe('Page 2 of 1,250');
  });

  it('reads the section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const { ariaLabels, announcements, formats } = read();
    expect(ariaLabels().next).toBe('Next page');

    pack.set({
      locale: 'de',
      paginator: {
        next: 'Nächste Seite',
        pageChange: 'Seite {page} von {totalPages}',
        range: '<b>{start}-{end}</b> von {total}',
      },
    });
    expect(ariaLabels().next).toBe('Nächste Seite');
    expect(announcements().pageChange(2, 1250)).toBe('Seite 2 von 1.250');
    expect(formats().range(1, 10, 1250)).toBe('<b>1-10</b> von 1.250');
    expect(ariaLabels().previous).toBe('Previous page');
  });

  it('lets the paginator features override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            paginator: { next: 'Nächste Seite', previous: 'Vorherige Seite' },
          }),
          withDocumentLanguage('off'),
        ),
        provideCngxPaginatorConfig(
          withPaginatorAriaLabels({ next: 'Weiter' }),
          withPaginatorRangeFormat((start, end, total) => `${start}-${end}/${total}`),
        ),
      ],
    });
    const { ariaLabels, formats } = read();
    expect(ariaLabels().next).toBe('Weiter');
    expect(ariaLabels().previous).toBe('Vorherige Seite');
    expect(formats().range(1, 10, 95)).toBe('1-10/95');
    expect(formats().pageStatus(2, 9)).toBe('Page <b>2</b> of 9');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = read();
    const german = runInSubtree([provideLocaleAt('de')], () => injectPaginatorAnnouncements());
    expect(root.announcements().pageChange(2, 1250)).toBe('Page 2 of 1,250');
    expect(german().pageChange(2, 1250)).toBe('Page 2 of 1.250');
  });

  it('keeps the bundle references for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = read();
    const second = read();
    expect(Object.is(first.ariaLabels, second.ariaLabels)).toBe(true);
    expect(Object.is(first.ariaLabels(), second.ariaLabels())).toBe(true);
    expect(Object.is(first.formats(), second.formats())).toBe(true);
  });
});
