import { Component, type Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideLocale } from '@cngx/core/utils';
import { createManualState } from '../async-state/create-manual-state';
import { CngxFilter } from '../filter/filter.directive';
import { CngxPaginate } from '../paginate/paginate.directive';
import { CngxSort } from '../sort/sort.directive';
import type { CngxSearch } from '@cngx/common/interactive';
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

describe('CngxSmartDataSource - no directives', () => {
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

  it('searches ignoring case and accents in the app locale', () => {
    TestBed.configureTestingModule({ providers: [provideLocale('tr')] });
    TestBed.runInInjectionContext(() => {
      const term = signal('uber');
      const search = { term } as unknown as CngxSearch;
      const people = signal([
        { name: 'Über', age: 1 },
        { name: 'Ida', age: 2 },
        { name: 'İzmir', age: 3 },
      ]);
      const ds = injectSmartDataSource(people, { search: () => search });
      expect(ds.filteredCount()).toBe(1);
      term.set('\u2068i');
      expect(ds.filteredCount()).toBe(1);
    });
  });

  it('keeps the default search exact across terms and changed rows', () => {
    TestBed.runInInjectionContext(() => {
      const term = signal('ub');
      const search = { term } as unknown as CngxSearch;
      const rows = signal([{ name: 'Über' }, { name: 'Ida' }]);
      const ds = injectSmartDataSource(rows, { search: () => search });
      expect(ds.filteredCount()).toBe(1);
      term.set('id');
      expect(ds.filteredCount()).toBe(1);
      rows.set([{ name: 'Idee' }, { name: 'Ida' }, { name: 'Uber' }]);
      expect(ds.filteredCount()).toBe(2);
      term.set('ub');
      expect(ds.filteredCount()).toBe(1);
    });
  });

  it('stays exact over more distinct values than any fold cache would hold', () => {
    TestBed.runInInjectionContext(() => {
      const term = signal('zurich 4999');
      const search = { term } as unknown as CngxSearch;
      const rows = signal(Array.from({ length: 5000 }, (_, i) => ({ name: `Zürich ${i}` })));
      const ds = injectSmartDataSource(rows, { search: () => search });
      expect(ds.filteredCount()).toBe(1);
      term.set('zurich 1');
      expect(ds.filteredCount()).toBe(1111);
      term.set('zurich 4999');
      expect(ds.filteredCount()).toBe(1);
    });
  });

  it('folds a row again when a field changes in place', () => {
    TestBed.runInInjectionContext(() => {
      const term = signal('ida');
      const search = { term } as unknown as CngxSearch;
      const row = { name: 'Ida' };
      const rows = signal([row]);
      const ds = injectSmartDataSource(rows, { search: () => search });
      expect(ds.filteredCount()).toBe(1);
      row.name = 'Über';
      term.set('uber');
      expect(ds.filteredCount()).toBe(1);
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

@Component({
  template: `<div cngxPaginate [total]="3"></div>`,
  imports: [CngxPaginate],
})
class PaginateHost {}

@Component({
  template: `<div cngxSort cngxSortActive="name" cngxSortDirection="desc"></div>`,
  imports: [CngxSort],
})
class ControlledSortHost {}

describe('CngxSmartDataSource - with directives', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [WithDirectivesHost, ControlledSortHost] }),
  );

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

  it('sorts by the controlled pin without any interaction', () => {
    const fixture = TestBed.createComponent(ControlledSortHost);
    fixture.detectChanges();

    const divDebug = fixture.debugElement.query(By.directive(CngxSort));
    const elemInjector: Injector = divDebug.injector;

    const data = signal(ITEMS);
    const ds = runInInjectionContext(elemInjector, () => injectSmartDataSource(data));

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

describe('CngxSmartDataSource - with CngxAsyncState source', () => {
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

  it('derived projections track the async-state source after asyncState was demoted to private', () => {
    TestBed.runInInjectionContext(() => {
      const state = createManualState<Item[]>();
      state.set('loading');
      const ds = injectSmartDataSource(state);

      expect(ds.isLoading()).toBe(true);
      expect(ds.isFirstLoad()).toBe(true);
      expect(ds.isBusy()).toBe(true);

      state.setSuccess(ITEMS);
      expect(ds.isLoading()).toBe(false);
      expect(ds.isFirstLoad()).toBe(false);
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

describe('CngxSmartDataSource - options-passed atoms', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [WithDirectivesHost, PaginateHost] }),
  );

  function hostedSort(): CngxSort {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(CngxSort)).injector.get(CngxSort);
  }

  it('an options-passed sort thunk reorders rows without any injectable CngxSort', () => {
    // Root injection context: no CngxSort above the source, only the thunk.
    TestBed.runInInjectionContext(() => {
      const sortDir = hostedSort();
      const data = signal(ITEMS);
      const ds = injectSmartDataSource(data, { sort: () => sortDir });

      sortDir.setSort('name');

      const values: Item[][] = [];
      const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
      TestBed.flushEffects();

      expect(values.at(-1)!.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
      sub.unsubscribe();
    });
  });

  it('a thunk resolving undefined first and an instance later starts sorting on the same source', () => {
    TestBed.runInInjectionContext(() => {
      const sortDir = hostedSort();
      sortDir.setSort('name');
      const sortRef = signal<CngxSort | undefined>(undefined);
      const data = signal(ITEMS);
      const ds = injectSmartDataSource(data, { sort: () => sortRef() });

      const values: Item[][] = [];
      const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
      TestBed.flushEffects();
      expect(values.at(-1)!.map((i) => i.name)).toEqual(['Charlie', 'Alice', 'Bob']);

      sortRef.set(sortDir);
      TestBed.flushEffects();
      expect(values.at(-1)!.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
      sub.unsubscribe();
    });
  });

  it('an injected CngxSort still works when the options bag carries no thunk', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();
    const elemInjector: Injector = fixture.debugElement.query(By.directive(CngxSort)).injector;
    const sortDir = elemInjector.get(CngxSort);

    const data = signal(ITEMS);
    const ds = runInInjectionContext(elemInjector, () => injectSmartDataSource(data, {}));
    sortDir.setSort('name');

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
    TestBed.flushEffects();

    expect(values.at(-1)!.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    sub.unsubscribe();
  });

  it('an options-passed paginate thunk slices rows without any injectable CngxPaginate', () => {
    TestBed.runInInjectionContext(() => {
      const fixture = TestBed.createComponent(PaginateHost);
      fixture.detectChanges();
      const paginateDir = fixture.debugElement
        .query(By.directive(CngxPaginate))
        .injector.get(CngxPaginate);
      paginateDir.setPageSize(2, true);

      const data = signal(ITEMS);
      const ds = injectSmartDataSource(data, { paginate: () => paginateDir });

      const values: Item[][] = [];
      const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
      TestBed.flushEffects();

      expect(values.at(-1)!.map((i) => i.name)).toEqual(['Charlie', 'Alice']);
      sub.unsubscribe();
    });
  });

  it('an options-passed sort wins over an injected instance', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();
    const elemInjector: Injector = fixture.debugElement.query(By.directive(CngxSort)).injector;
    const injectedSort = elemInjector.get(CngxSort);
    const optionSort = hostedSort();

    injectedSort.setSort('name');
    injectedSort.setSort('name'); // desc
    optionSort.setSort('name'); // asc

    const data = signal(ITEMS);
    const ds = runInInjectionContext(elemInjector, () =>
      injectSmartDataSource(data, { sort: () => optionSort }),
    );

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
    TestBed.flushEffects();

    expect(values.at(-1)!.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    sub.unsubscribe();
  });
});

describe('CngxSmartDataSource - reactivity equality', () => {
  it('connect() does not re-emit when source resets to a positionally-identical array', () => {
    TestBed.runInInjectionContext(() => {
      const data = signal(ITEMS);
      const ds = injectSmartDataSource(data);

      const values: Item[][] = [];
      const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
      TestBed.flushEffects();

      data.set([...ITEMS]);
      TestBed.flushEffects();

      // arrayEqual on filtered + processed collapses the duplicate emission.
      expect(values.length).toBe(1);
      sub.unsubscribe();
    });
  });
});

describe('CngxSmartDataSource - locale collation', () => {
  const names = ['Zebra', 'Äpfel', 'apple'];

  function sortedIn(locale: string): string[] {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [WithDirectivesHost],
      providers: [provideLocale(locale)],
    });
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();
    const injector: Injector = fixture.debugElement.query(By.directive(CngxSort)).injector;
    const data = signal(names.map((name, age) => ({ name, age })));
    const ds = runInInjectionContext(injector, () => injectSmartDataSource(data));
    injector.get(CngxSort).setSort('name');
    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v: Item[]) => values.push(v));
    TestBed.flushEffects();
    sub.unsubscribe();
    return values.at(-1)!.map((i) => i.name);
  }

  it('collates string keys in the app locale', () => {
    expect(sortedIn('de')).toEqual(['Äpfel', 'apple', 'Zebra']);
    expect(sortedIn('sv')).toEqual(['apple', 'Zebra', 'Äpfel']);
  });
});
