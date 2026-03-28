import { Component, type Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { createManualState } from './async-state/create-manual-state';
import { CngxFilter } from './filter.directive';
import { CngxSort } from './sort.directive';
import { CngxSmartDataSource, injectSmartDataSource } from './smart-data-source';

interface Item {
  name: string;
  age: number;
}

const ITEMS: Item[] = [
  { name: 'Charlie', age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 },
];

describe('CngxSmartDataSource — no directives', () => {
  it('passes data through unchanged', () => {
    TestBed.runInInjectionContext(() => {
      const data = signal(ITEMS);
      const ds = injectSmartDataSource(data);
      const values: Item[][] = [];
      const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
      TestBed.flushEffects();
      expect(values[0]).toEqual(ITEMS);
      sub.unsubscribe();
    });
  });

  it('disconnect() does not throw', () => {
    TestBed.runInInjectionContext(() => {
      const ds = injectSmartDataSource(signal([]));
      expect(() => ds.disconnect()).not.toThrow();
    });
  });

  it('returns CngxSmartDataSource instance', () => {
    TestBed.runInInjectionContext(() => {
      expect(injectSmartDataSource(signal([]))).toBeInstanceOf(CngxSmartDataSource);
    });
  });
});

@Component({
  template: `<div cngxSort [cngxFilter]="null"></div>`,
  imports: [CngxSort, CngxFilter],
})
class WithDirectivesHost {}

describe('CngxSmartDataSource — with directives', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [WithDirectivesHost] }));

  it('sorts ascending via CngxSort', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();

    const divDebug = fixture.debugElement.query(By.directive(CngxSort));
    const elemInjector: Injector = divDebug.injector;
    const sortDir = elemInjector.get(CngxSort);

    const data = signal(ITEMS);
    const ds = runInInjectionContext(elemInjector, () => injectSmartDataSource(data));

    sortDir.setSort('name');

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
    TestBed.flushEffects();

    const sorted = values.at(-1)!;
    expect(sorted.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    sub.unsubscribe();
  });

  it('sorts descending via CngxSort', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();

    const divDebug = fixture.debugElement.query(By.directive(CngxSort));
    const elemInjector: Injector = divDebug.injector;
    const sortDir = elemInjector.get(CngxSort);

    const data = signal(ITEMS);
    const ds = runInInjectionContext(elemInjector, () => injectSmartDataSource(data));

    sortDir.setSort('name');
    sortDir.setSort('name'); // toggle to desc

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
    TestBed.flushEffects();

    const sorted = values.at(-1)!;
    expect(sorted.map((i) => i.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    sub.unsubscribe();
  });

  it('sorts by multiple columns via CngxSort multi-sort', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();

    const divDebug = fixture.debugElement.query(By.directive(CngxSort));
    const elemInjector: Injector = divDebug.injector;
    const sortDir = elemInjector.get(CngxSort);

    // Tie-breaking data: two items share the same age
    const items = signal([
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 30 },
    ]);
    const ds = runInInjectionContext(elemInjector, () => injectSmartDataSource(items));

    // Primary sort: age asc; secondary (additive): name asc
    sortDir.setSort('age');
    sortDir.setSort('name', true);

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
    TestBed.flushEffects();

    const sorted = values.at(-1)!;
    expect(sorted.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    sub.unsubscribe();
  });

  it('filters via CngxFilter', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();

    const divDebug = fixture.debugElement.query(By.directive(CngxFilter));
    const elemInjector: Injector = divDebug.injector;
    const filterDir = elemInjector.get(CngxFilter<Item>);

    const data = signal(ITEMS);
    const ds = runInInjectionContext(elemInjector, () => injectSmartDataSource(data));

    filterDir.setPredicate((v) => v.name === 'Alice');

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
    TestBed.flushEffects();

    expect(values.at(-1)).toEqual([{ name: 'Alice', age: 25 }]);
    sub.unsubscribe();
  });
});

describe('CngxSmartDataSource — with CngxAsyncState source', () => {
  it('derives data from state.data()', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.setSuccess(ITEMS);
      const ds = injectSmartDataSource(state);

      const values: Item[][] = [];
      const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
      TestBed.flushEffects();

      expect(values.at(-1)).toEqual(ITEMS);
      sub.unsubscribe();
    });
  });

  it('isLoading is true when state.isFirstLoad() is true', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.set('loading');
      const ds = injectSmartDataSource(state);

      expect(ds.isLoading()).toBe(true);
      expect(ds.isFirstLoad()).toBe(true);
    });
  });

  it('isRefreshing is true when state is refreshing', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.setSuccess(ITEMS);
      state.set('refreshing');
      const ds = injectSmartDataSource(state);

      expect(ds.isRefreshing()).toBe(true);
    });
  });

  it('error exposes state.error()', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.setError(new Error('boom'));
      const ds = injectSmartDataSource(state);

      expect(ds.error()).toBeInstanceOf(Error);
      expect((ds.error() as Error).message).toBe('boom');
    });
  });

  it('isEmpty is false during loading (even with empty data)', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.set('loading');
      const ds = injectSmartDataSource(state);

      expect(ds.isEmpty()).toBe(false);
    });
  });

  it('isEmpty is true when not busy and filteredCount is 0', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.setSuccess([]);
      const ds = injectSmartDataSource(state);

      expect(ds.isEmpty()).toBe(true);
      expect(ds.filteredCount()).toBe(0);
    });
  });

  it('asyncState property exposes the original state', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      const ds = injectSmartDataSource(state);

      expect(ds.asyncState).toBe(state);
    });
  });

  it('filteredCount still works with async data', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.setSuccess(ITEMS);
      const ds = injectSmartDataSource(state);

      expect(ds.filteredCount()).toBe(3);
    });
  });
});
