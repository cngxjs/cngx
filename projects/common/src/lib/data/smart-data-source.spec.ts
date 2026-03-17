import { Component, type Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFilter } from '../behaviors/data/filter.directive';
import { CngxSort } from '../behaviors/data/sort.directive';
import { CngxSmartDataSource, cngxSmartDataSource } from './smart-data-source';

type Item = { name: string; age: number };

const ITEMS: Item[] = [
  { name: 'Charlie', age: 30 },
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 },
];

describe('CngxSmartDataSource — no directives', () => {
  it('passes data through unchanged', () => {
    TestBed.runInInjectionContext(() => {
      const data = signal(ITEMS);
      const ds = cngxSmartDataSource(data);
      const values: Item[][] = [];
      const sub = ds.connect().subscribe((v) => values.push(v));
      expect(values[0]).toEqual(ITEMS);
      sub.unsubscribe();
    });
  });

  it('disconnect() does not throw', () => {
    TestBed.runInInjectionContext(() => {
      const ds = cngxSmartDataSource(signal([]));
      expect(() => ds.disconnect()).not.toThrow();
    });
  });

  it('returns CngxSmartDataSource instance', () => {
    TestBed.runInInjectionContext(() => {
      expect(cngxSmartDataSource(signal([]))).toBeInstanceOf(CngxSmartDataSource);
    });
  });
});

@Component({
  template: `<div cngxSort cngxFilter></div>`,
  imports: [CngxSort, CngxFilter],
})
class WithDirectivesHost {}

describe('CngxSmartDataSource — with directives', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [WithDirectivesHost] }));

  it('sorts ascending via CngxSort', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();

    const hostInjector: Injector = fixture.debugElement.injector;
    const sortDir = fixture.debugElement.query(By.directive(CngxSort)).injector.get(CngxSort);

    const data = signal(ITEMS);
    const ds = hostInjector.runInContext(() => cngxSmartDataSource(data));

    sortDir.setSort('name');

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v) => values.push(v));
    TestBed.flushEffects();

    const sorted = values.at(-1)!;
    expect(sorted.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    sub.unsubscribe();
  });

  it('sorts descending via CngxSort', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();

    const hostInjector: Injector = fixture.debugElement.injector;
    const sortDir = fixture.debugElement.query(By.directive(CngxSort)).injector.get(CngxSort);

    const data = signal(ITEMS);
    const ds = hostInjector.runInContext(() => cngxSmartDataSource(data));

    sortDir.setSort('name');
    sortDir.setSort('name'); // toggle to desc

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v) => values.push(v));
    TestBed.flushEffects();

    const sorted = values.at(-1)!;
    expect(sorted.map((i) => i.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    sub.unsubscribe();
  });

  it('filters via CngxFilter', () => {
    const fixture = TestBed.createComponent(WithDirectivesHost);
    fixture.detectChanges();

    const hostInjector: Injector = fixture.debugElement.injector;
    const filterDir = fixture.debugElement
      .query(By.directive(CngxFilter))
      .injector.get(CngxFilter<Item>);

    const data = signal(ITEMS);
    const ds = hostInjector.runInContext(() => cngxSmartDataSource(data));

    filterDir.setPredicate((v) => v.name === 'Alice');

    const values: Item[][] = [];
    const sub = ds.connect().subscribe((v) => values.push(v));
    TestBed.flushEffects();

    expect(values.at(-1)).toEqual([{ name: 'Alice', age: 25 }]);
    sub.unsubscribe();
  });
});
