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
import { runInSubtree } from '@cngx/testing';

import {
  injectIncrementalListAriaLabels,
  provideIncrementalListConfig,
  withIncrementalListAriaLabels,
} from '../incremental-list-config';
import { CNGX_COLLECTION_LANGUAGE_EN } from './collection-language-section';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['collection'] = CNGX_COLLECTION_LANGUAGE_EN;

const labels = () => TestBed.runInInjectionContext(() => injectIncrementalListAriaLabels());

describe('collection language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English labels from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = labels()();
    expect(en.loading).toBe('Loading');
    expect(en.empty).toBe('Nothing here yet');
    expect(en.error).toBe('Failed to load');
    expect(en.pageError).toBe('Failed to load more');
    expect(en.retry).toBe('Retry');
    expect(en.endReached(4)).toBe('All 4 loaded');
    expect(en.loadedMore(2, 4)).toBe('2 more loaded. 4 total.');
    expect(EN_SECTION.endReached).toBe('All {count} loaded');
  });

  it('formats the counts for the locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = labels()();
    expect(en.endReached(1200)).toBe('All 1,200 loaded');
    expect(en.loadedMore(50, 1250)).toBe('50 more loaded. 1,250 total.');
  });

  it('reads the section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const resolved = labels();
    expect(resolved().empty).toBe('Nothing here yet');

    pack.set({
      locale: 'de',
      collection: {
        empty: 'Noch nichts hier',
        endReached: { one: '{count} Eintrag geladen', other: 'Alle {count} geladen' },
      },
    });
    const de = resolved();
    expect(de.empty).toBe('Noch nichts hier');
    expect(de.endReached(1)).toBe('1 Eintrag geladen');
    expect(de.endReached(1200)).toBe('Alle 1.200 geladen');
    expect(de.retry).toBe('Retry');
  });

  it('lets withIncrementalListAriaLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({ locale: 'de', collection: { empty: 'Leer', retry: 'Nochmal' } }),
          withDocumentLanguage('off'),
        ),
        provideIncrementalListConfig(withIncrementalListAriaLabels({ empty: 'Noch nichts hier' })),
      ],
    });
    const resolved = labels()();
    expect(resolved.empty).toBe('Noch nichts hier');
    expect(resolved.retry).toBe('Nochmal');
  });

  it('reads the section for a key an override sets to undefined', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideIncrementalListConfig(withIncrementalListAriaLabels({ empty: undefined })),
      ],
    });
    expect(labels()().empty).toBe('Nothing here yet');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = labels();
    const german = runInSubtree([provideLocaleAt('de')], () => injectIncrementalListAriaLabels());
    expect(root().endReached(1200)).toBe('All 1,200 loaded');
    expect(german().endReached(1200)).toBe('All 1.200 loaded');
  });

  it('keeps the labels reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = labels();
    const second = labels();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
  });
});
