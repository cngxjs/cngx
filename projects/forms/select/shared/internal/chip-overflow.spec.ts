import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createChipOverflow } from './chip-overflow';
import type { CngxSelectOptionDef } from '../option.model';

type T = string;

function opt(value: T): CngxSelectOptionDef<T> {
  return { value, label: value, disabled: false };
}

function makeHarness(initial: T[], mode: 'wrap' | 'scroll-x' | 'truncate', cap = 3) {
  const selectedOptions = signal<CngxSelectOptionDef<T>[]>(initial.map(opt));
  const chipOverflow = signal<'wrap' | 'scroll-x' | 'truncate'>(mode);
  const maxVisibleChips = signal<number>(cap);
  const strip = createChipOverflow<T>({ selectedOptions, chipOverflow, maxVisibleChips });
  return { selectedOptions, chipOverflow, maxVisibleChips, strip };
}

describe('createChipOverflow', () => {
  it('passes the full selection through in wrap mode with zero badge count', () => {
    const h = makeHarness(['a', 'b', 'c', 'd'], 'wrap', 2);
    expect(h.strip.visibleSelected().map((o) => o.value)).toEqual(['a', 'b', 'c', 'd']);
    expect(h.strip.overflowBadgeCount()).toBe(0);
  });

  it('passes the full selection through in scroll-x mode with zero badge count', () => {
    const h = makeHarness(['a', 'b', 'c'], 'scroll-x', 1);
    expect(h.strip.visibleSelected().map((o) => o.value)).toEqual(['a', 'b', 'c']);
    expect(h.strip.overflowBadgeCount()).toBe(0);
  });

  it('caps at maxVisibleChips in truncate mode and reports the remainder', () => {
    const h = makeHarness(['a', 'b', 'c', 'd', 'e'], 'truncate', 3);
    expect(h.strip.visibleSelected().map((o) => o.value)).toEqual(['a', 'b', 'c']);
    expect(h.strip.overflowBadgeCount()).toBe(2);
  });

  it('returns the selection verbatim when it fits within the cap', () => {
    const h = makeHarness(['a', 'b'], 'truncate', 3);
    expect(h.strip.visibleSelected().map((o) => o.value)).toEqual(['a', 'b']);
    expect(h.strip.overflowBadgeCount()).toBe(0);
  });

  it('floors the cap to 1 so a zero/negative maxVisibleChips still shows one chip', () => {
    const h = makeHarness(['a', 'b', 'c'], 'truncate', 0);
    expect(h.strip.visibleSelected().map((o) => o.value)).toEqual(['a']);
    expect(h.strip.overflowBadgeCount()).toBe(2);
  });

  it('tracks mode flips reactively', () => {
    const h = makeHarness(['a', 'b', 'c', 'd'], 'truncate', 2);
    expect(h.strip.visibleSelected().length).toBe(2);
    expect(h.strip.overflowBadgeCount()).toBe(2);
    h.chipOverflow.set('wrap');
    expect(h.strip.visibleSelected().length).toBe(4);
    expect(h.strip.overflowBadgeCount()).toBe(0);
  });
});
