import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { tabsEqual } from './presenter.directive';
import type { CngxTabHandle } from './tab-group-host.token';

function handle(
  id: string,
  opts: { label?: string; subLabel?: string; disabled?: boolean; closable?: boolean } = {},
): CngxTabHandle {
  return {
    id,
    label: signal(opts.label ?? id),
    subLabel: signal(opts.subLabel),
    disabled: signal(opts.disabled ?? false),
    errorAggregator: signal(undefined),
    hasError: signal(false),
    errorMessage: signal(undefined),
    closable: signal(opts.closable),
  };
}

describe('tabsEqual', () => {
  it('returns true for the identical array reference', () => {
    const a = [handle('a'), handle('b')];
    expect(tabsEqual(a, a)).toBe(true);
  });

  it('returns true for two array wrappers around the same handle instances', () => {
    const first = handle('a');
    const second = handle('b');
    expect(tabsEqual([first, second], [first, second])).toBe(true);
  });

  it('returns false for value-identical arrays of DIFFERENT instances - reference is the change signal', () => {
    // The idempotent re-register replace path: a new instance with the
    // same id/label/disabled must NOT compare equal, or the signal
    // discards the write and keeps serving the destroyed instance.
    const a = [handle('a', { label: 'A' }), handle('b', { label: 'B' })];
    const b = [handle('a', { label: 'A' }), handle('b', { label: 'B' })];
    expect(tabsEqual(a, b)).toBe(false);
  });

  it('returns false on length mismatch', () => {
    const first = handle('a');
    expect(tabsEqual([first, handle('b')], [first])).toBe(false);
  });

  it('returns false when the same instances are reordered', () => {
    const first = handle('a');
    const second = handle('b');
    expect(tabsEqual([first, second], [second, first])).toBe(false);
  });

  it('returns true on two empty arrays', () => {
    expect(tabsEqual([], [])).toBe(true);
  });
});
