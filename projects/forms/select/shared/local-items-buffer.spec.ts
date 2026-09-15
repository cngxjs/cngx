import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  CNGX_LOCAL_ITEMS_BUFFER_FACTORY,
  createLocalItemsBuffer,
} from './local-items-buffer';
import type { CngxSelectCompareFn } from './internal/select-core';

type T = string;

function keyed(): {
  buffer: ReturnType<typeof createLocalItemsBuffer<T>>;
  compare: ReturnType<typeof signal<CngxSelectCompareFn<T>>>;
} {
  const compare = signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b));
  return { buffer: createLocalItemsBuffer<T>(compare), compare };
}

describe('createLocalItemsBuffer', () => {
  let buffer: ReturnType<typeof createLocalItemsBuffer<T>>;
  let compare: ReturnType<typeof signal<CngxSelectCompareFn<T>>>;

  beforeEach(() => {
    ({ buffer, compare } = keyed());
  });

  it('starts empty', () => {
    expect(buffer.items()).toEqual([]);
  });

  it('appends a patched option', () => {
    buffer.patch({ value: 'a', label: 'A' });
    expect(buffer.items()).toEqual([{ value: 'a', label: 'A' }]);
  });

  it('is a no-op when an entry already matches the value under compareWith', () => {
    buffer.patch({ value: 'a', label: 'A' });
    const before = buffer.items();
    buffer.patch({ value: 'a', label: 'A relabelled' });
    // Same identity signal reference: no emit, first label wins.
    expect(buffer.items()).toBe(before);
    expect(buffer.items()).toEqual([{ value: 'a', label: 'A' }]);
  });

  it('reads compareWith lazily so a mid-flight comparator swap is honoured', () => {
    // Comparator that treats every value as distinct: both patches land.
    compare.set(() => false);
    buffer.patch({ value: 'a', label: 'A' });
    buffer.patch({ value: 'a', label: 'A again' });
    expect(buffer.items().length).toBe(2);

    // Swap to an always-equal comparator: the next dup patch is dropped.
    compare.set(() => true);
    const before = buffer.items();
    buffer.patch({ value: 'b', label: 'B' });
    expect(buffer.items()).toBe(before);
  });

  it('clears to empty', () => {
    buffer.patch({ value: 'a', label: 'A' });
    buffer.clear();
    expect(buffer.items()).toEqual([]);
  });

  it('clear is idempotent - no emit when already empty', () => {
    const before = buffer.items();
    buffer.clear();
    expect(buffer.items()).toBe(before);
  });
});

describe('CNGX_LOCAL_ITEMS_BUFFER_FACTORY', () => {
  it('defaults to createLocalItemsBuffer', () => {
    const factory = TestBed.inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY);
    expect(factory).toBe(createLocalItemsBuffer);
  });

  it('the default factory builds a working buffer', () => {
    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      const factory = TestBed.inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY);
      const buf = factory<T>(signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b)));
      buf.patch({ value: 'x', label: 'X' });
      expect(buf.items()).toEqual([{ value: 'x', label: 'X' }]);
    });
  });
});
