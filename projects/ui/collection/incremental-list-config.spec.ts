import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { CNGX_COLLECTION_LANGUAGE_EN } from './i18n/collection-language-section';
import {
  injectIncrementalListAriaLabels,
  provideIncrementalListConfig,
  withIncrementalListAriaLabels,
  type CngxIncrementalListAriaLabels,
} from './incremental-list-config';

const resolve = () => TestBed.runInInjectionContext(() => injectIncrementalListAriaLabels());

describe('incremental-list ariaLabels cascade', () => {
  test('resolves plain overrides over the collection section', () => {
    TestBed.configureTestingModule({
      providers: [
        provideIncrementalListConfig(
          withIncrementalListAriaLabels({ empty: 'Noch nichts hier' }),
          withIncrementalListAriaLabels({ retry: 'Erneut versuchen' }),
        ),
      ],
    });
    const labels = resolve()();
    expect(labels.empty).toBe('Noch nichts hier');
    expect(labels.retry).toBe('Erneut versuchen');
    expect(labels.loading).toBe(CNGX_COLLECTION_LANGUAGE_EN.loading);
    expect(labels.pageError).toBe(CNGX_COLLECTION_LANGUAGE_EN.pageError);
  });

  test('follows Signal overrides and keeps the bundle reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideIncrementalListConfig(
          withIncrementalListAriaLabels(
            computed<Partial<CngxIncrementalListAriaLabels>>(() =>
              lang() === 'en' ? {} : { empty: 'Noch nichts hier' },
            ),
          ),
        ),
      ],
    });
    const labels = resolve();
    expect(labels().empty).toBe('Nothing here yet');

    lang.set('de');
    const german = labels();
    expect(german.empty).toBe('Noch nichts hier');
    expect(german.retry).toBe('Retry');

    lang.set('de-AT');
    expect(labels()).toBe(german);
  });
});
