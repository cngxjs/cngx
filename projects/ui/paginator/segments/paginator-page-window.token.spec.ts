import { provideZonelessChangeDetection, runInInjectionContext, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { pageWindow } from './page-model';
import {
  CNGX_PAGINATOR_PAGE_WINDOW_FACTORY,
  createPaginatorPageWindow,
} from './paginator-page-window.token';

describe('CNGX_PAGINATOR_PAGE_WINDOW_FACTORY', () => {
  test('the root default resolves to createPaginatorPageWindow', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const factory = runInInjectionContext(TestBed.inject(Injector), () =>
      TestBed.inject(CNGX_PAGINATOR_PAGE_WINDOW_FACTORY),
    );
    expect(factory).toBe(createPaginatorPageWindow);
  });

  test('the default factory produces the byte-identical v1 window', () => {
    const fn = createPaginatorPageWindow();
    for (let current = 0; current < 20; current++) {
      expect(fn(current, 20, 1, 1)).toEqual(pageWindow(current, 20));
    }
  });
});
