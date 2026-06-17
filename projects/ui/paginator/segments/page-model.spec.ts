import { computed, signal } from '@angular/core';
import { describe, expect, test } from 'vitest';

import { pageWindow, pageWindowEqual, type PageItem } from './page-model';

/** Compact rendering: page -> its display number (1-based), gap -> `…(hidden)`. */
function shape(items: readonly PageItem[]): string[] {
  return items.map((it) =>
    it.kind === 'page' ? String(it.index + 1) : `…(${it.hidden.map((h) => h + 1).join(',')})`,
  );
}

describe('pageWindow', () => {
  test('shows every page when the count fits without truncation', () => {
    const { pages, gaps } = pageWindow(0, 5);
    expect(shape(pages)).toEqual(['1', '2', '3', '4', '5']);
    expect(gaps).toBe(0);
  });

  test('a single hidden page renders as a page button, not a gap', () => {
    // total 7, current 0: the slot between boundary and window is one page.
    const { pages, gaps } = pageWindow(0, 7);
    expect(gaps).toBe(0);
    expect(shape(pages)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  test('one trailing gap near the start', () => {
    const { pages, gaps } = pageWindow(0, 10);
    expect(shape(pages)).toEqual(['1', '2', '3', '4', '5', '…(6,7,8,9)', '10']);
    expect(gaps).toBe(1);
  });

  test('two gaps when the current page is in the middle', () => {
    const { pages, gaps } = pageWindow(4, 10);
    expect(shape(pages)).toEqual(['1', '…(2,3)', '4', '5', '6', '…(7,8,9)', '10']);
    expect(gaps).toBe(2);
  });

  test('one leading gap near the end', () => {
    const { pages, gaps } = pageWindow(9, 10);
    expect(shape(pages)).toEqual(['1', '…(2,3,4,5)', '6', '7', '8', '9', '10']);
    expect(gaps).toBe(1);
  });

  test('the active page always appears as a page button in the window', () => {
    for (let current = 0; current < 50; current++) {
      const { pages } = pageWindow(current, 50);
      const hasActive = pages.some((it) => it.kind === 'page' && it.index === current);
      expect(hasActive).toBe(true);
    }
  });

  test('clamps an out-of-range current into the page set', () => {
    const { pages } = pageWindow(99, 3);
    expect(shape(pages)).toEqual(['1', '2', '3']);
  });

  test('degenerate total still yields page 1', () => {
    expect(shape(pageWindow(0, 0).pages)).toEqual(['1']);
  });
});

describe('pageWindowEqual', () => {
  test('two windows from identical inputs are structurally equal', () => {
    expect(pageWindowEqual(pageWindow(4, 10), pageWindow(4, 10))).toBe(true);
  });

  test('different current pages are not equal', () => {
    expect(pageWindowEqual(pageWindow(4, 10), pageWindow(5, 10))).toBe(false);
  });

  test('keeps a computed reference stable across an equal recompute', () => {
    const trigger = signal(0);
    const win = computed(
      () => {
        trigger();
        return pageWindow(4, 10);
      },
      { equal: pageWindowEqual },
    );

    const first = win();
    trigger.set(1); // forces recompute; the window is structurally identical
    const second = win();
    expect(second).toBe(first);
  });
});
