import type { ResourceStatus } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  nextResourceLatch,
  resourceLatchEqual,
  type ResourceLatch,
  type ResourceLatchPrevious,
  type ResourceLatchSource,
} from './resource-latch';

const T0 = new Date(1_000);
const T1 = new Date(2_000);
const NOW = new Date(3_000);
const DATA = ['a'];
const ERR = new Error('boom');

function src(
  status: ResourceStatus,
  extra: Partial<ResourceLatchSource<string[]>> = {},
): ResourceLatchSource<string[]> {
  const hasValue = extra.hasValue ?? false;
  return { status, hasValue, value: hasValue ? DATA : undefined, error: undefined, ...extra };
}

const held: ResourceLatch<string[]> = { has: true, value: DATA, at: T0 };
const empty: ResourceLatch<string[]> = { has: false, value: undefined, at: T1 };

function prev(
  source: ResourceLatchSource<string[]>,
  value: ResourceLatch<string[]> = held,
): ResourceLatchPrevious<string[]> {
  return { source, value };
}

describe('nextResourceLatch', () => {
  it.each<ResourceStatus>(['resolved', 'local'])('%s sets the latch with a new timestamp', (s) => {
    expect(nextResourceLatch(src(s, { hasValue: true }), prev(src('loading'), empty), NOW)).toEqual(
      { has: true, value: DATA, at: NOW },
    );
  });

  it.each<ResourceStatus>(['idle', 'loading'])(
    '%s clears the latch and keeps the timestamp',
    (s) => {
      expect(nextResourceLatch(src(s), prev(src('resolved', { hasValue: true })), NOW)).toEqual({
        has: false,
        value: undefined,
        at: T0,
      });
    },
  );

  it('reloading with a value sets the latch and keeps the timestamp', () => {
    expect(
      nextResourceLatch(
        src('reloading', { hasValue: true }),
        prev(src('resolved', { hasValue: true })),
        NOW,
      ),
    ).toEqual({ has: true, value: DATA, at: T0 });
  });

  it('reloading with a value and no history stamps now', () => {
    expect(nextResourceLatch(src('reloading', { hasValue: true }), undefined, NOW)).toEqual({
      has: true,
      value: DATA,
      at: NOW,
    });
  });

  it('reloading without a value after the identical error carries the latch', () => {
    const previous = prev(src('error', { error: ERR }));
    expect(nextResourceLatch(src('reloading', { error: ERR }), previous, NOW)).toBe(previous.value);
  });

  it('reloading without a value after a different error clears the latch', () => {
    const previous = prev(src('error', { error: new Error('other') }));
    expect(nextResourceLatch(src('reloading', { error: ERR }), previous, NOW).has).toBe(false);
  });

  it.each<ResourceStatus>(['loading', 'resolved', 'idle'])(
    'reloading without a value after %s clears the latch',
    (s) => {
      expect(nextResourceLatch(src('reloading'), prev(src(s)), NOW).has).toBe(false);
    },
  );

  it('error after reloading carries the latch', () => {
    const previous = prev(src('reloading', { hasValue: true }));
    expect(nextResourceLatch(src('error', { error: ERR }), previous, NOW)).toBe(previous.value);
  });

  it.each<ResourceStatus>(['loading', 'resolved', 'local', 'idle', 'error'])(
    'error after %s clears the latch',
    (s) => {
      expect(nextResourceLatch(src('error', { error: ERR }), prev(src(s)), NOW)).toEqual({
        has: false,
        value: undefined,
        at: T0,
      });
    },
  );

  it('error with no history clears the latch', () => {
    expect(nextResourceLatch(src('error', { error: ERR }), undefined, NOW)).toEqual({
      has: false,
      value: undefined,
      at: undefined,
    });
  });

  describe('read gaps', () => {
    it('read resolved, skipped loading, read error: cleared', () => {
      const resolved = nextResourceLatch(src('resolved', { hasValue: true }), undefined, T0);
      const next = nextResourceLatch(
        src('error', { error: ERR }),
        prev(src('resolved', { hasValue: true }), resolved),
        NOW,
      );
      expect(next.has).toBe(false);
      expect(next.value).toBeUndefined();
    });

    it('read error with a latch, skipped params change, read a new error object: cleared', () => {
      const previous = prev(src('error', { error: ERR }));
      const next = nextResourceLatch(
        src('reloading', { error: new Error('new request') }),
        previous,
        NOW,
      );
      expect(next.has).toBe(false);
      const after = nextResourceLatch(
        src('error', { error: new Error('new request') }),
        previous,
        NOW,
      );
      expect(after.has).toBe(false);
    });

    it('resolved straight to error: cleared', () => {
      expect(
        nextResourceLatch(
          src('error', { error: ERR }),
          prev(src('resolved', { hasValue: true })),
          NOW,
        ).has,
      ).toBe(false);
    });
  });
});

describe('resourceLatchEqual', () => {
  it('compares has, value identity and timestamp time', () => {
    expect(resourceLatchEqual(held, { has: true, value: DATA, at: new Date(T0.getTime()) })).toBe(
      true,
    );
    expect(resourceLatchEqual(held, { ...held, value: ['a'] })).toBe(false);
    expect(resourceLatchEqual(held, { ...held, has: false })).toBe(false);
    expect(resourceLatchEqual(held, { ...held, at: T1 })).toBe(false);
  });
});
