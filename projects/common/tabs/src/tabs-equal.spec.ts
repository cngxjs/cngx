import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { tabsEqual } from './presenter.directive';
import type { CngxTabHandle } from './tab-group-host.token';

function handle(
  id: string,
  opts: { label?: string; disabled?: boolean } = {},
): CngxTabHandle {
  return {
    id,
    label: signal(opts.label ?? id),
    disabled: signal(opts.disabled ?? false),
    errorAggregator: signal(undefined),
  };
}

describe('tabsEqual', () => {
  it('returns true for identical references', () => {
    const a = [handle('a'), handle('b')];
    expect(tabsEqual(a, a)).toBe(true);
  });

  it('returns true for two arrays with the same id / label / disabled per entry', () => {
    const a = [handle('a', { label: 'A' }), handle('b', { label: 'B' })];
    const b = [handle('a', { label: 'A' }), handle('b', { label: 'B' })];
    expect(tabsEqual(a, b)).toBe(true);
  });

  it('returns false on length mismatch', () => {
    const a = [handle('a'), handle('b')];
    const b = [handle('a')];
    expect(tabsEqual(a, b)).toBe(false);
  });

  it('returns false when one entry id differs', () => {
    const a = [handle('a'), handle('b')];
    const b = [handle('a'), handle('z')];
    expect(tabsEqual(a, b)).toBe(false);
  });

  it('returns false when one entry disabled flag differs', () => {
    const a = [handle('a'), handle('b', { disabled: false })];
    const b = [handle('a'), handle('b', { disabled: true })];
    expect(tabsEqual(a, b)).toBe(false);
  });

  it('returns false when one entry label text differs', () => {
    const a = [handle('a', { label: 'A' })];
    const b = [handle('a', { label: 'A2' })];
    expect(tabsEqual(a, b)).toBe(false);
  });

  it('does NOT compare errorAggregator references — equal returns true even when aggregators differ', () => {
    const stubAggregator = (hasErrorValue: boolean): CngxErrorAggregatorContract => ({
      hasError: signal(hasErrorValue),
      errorCount: signal(hasErrorValue ? 1 : 0),
      activeErrors: signal<readonly string[]>([]),
      errorLabels: signal<readonly string[]>([]),
      shouldShow: signal(hasErrorValue),
      announcement: signal(''),
      addSource: () => {},
      removeSource: () => {},
    });
    const a: CngxTabHandle[] = [
      {
        id: 'a',
        label: signal('A'),
        disabled: signal(false),
        errorAggregator: signal(stubAggregator(false)),
      },
    ];
    const b: CngxTabHandle[] = [
      {
        id: 'a',
        label: signal('A'),
        disabled: signal(false),
        errorAggregator: signal(stubAggregator(true)),
      },
    ];
    expect(tabsEqual(a, b)).toBe(true);
  });

  it('returns true on two empty arrays', () => {
    expect(tabsEqual([], [])).toBe(true);
  });
});
