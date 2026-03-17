import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxDataSource, injectDataSource } from './data-source';

describe('CngxDataSource', () => {
  it('connect() emits current signal value', async () => {
    await TestBed.runInInjectionContext(async () => {
      const data = signal([1, 2, 3]);
      const ds = injectDataSource(data);
      const values: number[][] = [];
      const sub = ds.connect().subscribe((v) => values.push(v));
      TestBed.flushEffects();
      expect(values[0]).toEqual([1, 2, 3]);
      sub.unsubscribe();
    });
  });

  it('connect() emits updated signal value', async () => {
    await TestBed.runInInjectionContext(async () => {
      const data = signal([1]);
      const ds = injectDataSource(data);
      const values: number[][] = [];
      const sub = ds.connect().subscribe((v) => values.push(v));
      TestBed.flushEffects();
      data.set([1, 2]);
      TestBed.flushEffects();
      expect(values).toHaveLength(2);
      expect(values[1]).toEqual([1, 2]);
      sub.unsubscribe();
    });
  });

  it('disconnect() does not throw', async () => {
    await TestBed.runInInjectionContext(async () => {
      const ds = injectDataSource(signal([]));
      expect(() => ds.disconnect()).not.toThrow();
    });
  });
});

describe('injectDataSource()', () => {
  it('returns a CngxDataSource instance', () => {
    TestBed.runInInjectionContext(() => {
      const ds = injectDataSource(signal([]));
      expect(ds).toBeInstanceOf(CngxDataSource);
    });
  });
});
