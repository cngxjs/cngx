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

import { withDataGridAccordionLabels } from '../config/features';
import { provideDataGridAccordionConfig } from '../config/provide-data-grid-accordion-config';
import { injectDataGridAccordionLabels } from './data-grid-accordion-i18n';
import { CNGX_DATA_GRID_ACCORDION_LANGUAGE_EN } from './data-grid-accordion-language-section';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['dataGridAccordion'] = CNGX_DATA_GRID_ACCORDION_LANGUAGE_EN;

function labels() {
  return TestBed.runInInjectionContext(() => injectDataGridAccordionLabels());
}

describe('data-grid-accordion language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English copy from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = labels()();
    expect(en.count(1)).toBe('1 result');
    expect(en.count(4)).toBe('4 results');
    expect(en.countSingular).toBe('result');
    expect(en.countPlural).toBe('results');
    expect(stripBidiIsolates(en.countWithNoun(3, 'rows'))).toBe('3 rows');
    expect(en.sortNone).toBe('not sorted, activate to sort ascending');
    expect(en.sortAscending).toBe('sorted ascending, activate to sort descending');
    expect(en.sortDescending).toBe('sorted descending, activate to sort ascending');
    expect(en.sortAnnouncedAscending).toBe('Sorted by {label} ascending');
    expect(en.sortAnnouncedDescending).toBe('Sorted by {label} descending');
    expect(en.sortAnnouncedCleared).toBe('Sorting by {label} cleared');
    expect(en.unlabeledColumn).toBe('this column');
    expect(en.filter).toBe('Filter');
    expect(en.filterRows).toBe('Filter rows');
    expect(en.rowLoadFailed).toBe('Could not load');
    expect(en.note).toBe('NOTE');
    expect(EN_SECTION.countWithNoun).toBe('{count} {noun}');
  });

  it('formats the count in the locale (behaviour change: grouped digits)', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    expect(labels()().count(1200)).toBe('1,200 results');
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
    expect(resolved().filter).toBe('Filter');

    pack.set({
      locale: 'de',
      dataGridAccordion: {
        count: { one: '{count} Treffer', other: '{count} Treffer' },
        filter: 'Filtern',
        sortAnnouncedAscending: 'Nach {label} aufsteigend sortiert',
      },
    });
    const de = resolved();
    expect(de.filter).toBe('Filtern');
    expect(de.count(1200)).toBe('1.200 Treffer');
    expect(de.sortAnnouncedAscending).toBe('Nach {label} aufsteigend sortiert');
    expect(de.filterRows).toBe('Filter rows');
  });

  it('lets withDataGridAccordionLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            dataGridAccordion: { filter: 'Filtern', filterRows: 'Zeilen filtern' },
          }),
          withDocumentLanguage('off'),
        ),
        provideDataGridAccordionConfig(withDataGridAccordionLabels({ filter: 'Suchen' })),
      ],
    });
    const resolved = labels()();
    expect(resolved.filter).toBe('Suchen');
    expect(resolved.filterRows).toBe('Zeilen filtern');
    expect(resolved.note).toBe('NOTE');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = labels();
    const german = runInSubtree([provideLocaleAt('de')], () => injectDataGridAccordionLabels());
    expect(root().count(1200)).toBe('1,200 results');
    expect(german().count(1200)).toBe('1.200 results');
  });

  it('keeps the label reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = labels();
    const second = labels();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
  });
});
