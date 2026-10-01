import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import {
  CNGX_INCREMENTAL_LIST_DEFAULTS,
  injectIncrementalListAriaLabels,
  provideIncrementalListConfig,
  withIncrementalListAriaLabels,
  type CngxIncrementalListAriaLabels,
} from './incremental-list-config';

const resolve = () => TestBed.runInInjectionContext(() => injectIncrementalListAriaLabels());

describe('incremental-list ariaLabels cascade', () => {
  test('resolves plain overrides to the same bundle as the eager merge did', () => {
    TestBed.configureTestingModule({
      providers: [
        provideIncrementalListConfig(
          withIncrementalListAriaLabels({ empty: 'Noch nichts hier' }),
          withIncrementalListAriaLabels({ retry: 'Erneut versuchen' }),
        ),
      ],
    });
    expect(resolve()()).toEqual({
      ...CNGX_INCREMENTAL_LIST_DEFAULTS.ariaLabels,
      empty: 'Noch nichts hier',
      retry: 'Erneut versuchen',
    });
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
