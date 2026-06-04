import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxFilter } from './filter.directive';

@Component({
  template: '<div [cngxFilter]="null"></div>',
  imports: [CngxFilter],
})
class TestHost {}

describe('CngxFilter', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function getDir(): CngxFilter {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(CngxFilter)).injector.get(CngxFilter);
  }

  it('starts with no predicate', () => {
    const dir = getDir();
    expect(dir.predicate()).toBeNull();
    expect(dir.isActive()).toBe(false);
    expect(dir.activeCount()).toBe(0);
  });

  it('setPredicate activates the filter', () => {
    const dir = getDir();
    const fn = (v: unknown) => !!v;
    dir.setPredicate(fn);
    expect(dir.predicate()).toBe(fn);
    expect(dir.isActive()).toBe(true);
    expect(dir.activeCount()).toBe(1);
  });

  it('clear() removes the predicate', () => {
    const dir = getDir();
    dir.setPredicate(() => true);
    dir.clear();
    expect(dir.predicate()).toBeNull();
    expect(dir.isActive()).toBe(false);
    expect(dir.activeCount()).toBe(0);
  });

  it('emits filterChange on setPredicate', () => {
    const dir = getDir();
    const spy = vi.fn();
    dir.filterChange.subscribe(spy);
    const fn = () => true;
    dir.setPredicate(fn);
    expect(spy).toHaveBeenCalledWith(fn);
  });

  it('emits filterChange with null on clear()', () => {
    const dir = getDir();
    const spy = vi.fn();
    dir.filterChange.subscribe(spy);
    dir.clear();
    expect(spy).toHaveBeenCalledWith(null);
  });

  describe('multi-filter', () => {
    it('addPredicate adds a named predicate', () => {
      const dir = getDir();
      const fn = (v: unknown) => !!v;
      dir.addPredicate('role', fn);
      expect(dir.predicates().get('role')).toBe(fn);
      expect(dir.activeCount()).toBe(1);
      expect(dir.isActive()).toBe(true);
    });

    it('addPredicate replaces existing key', () => {
      const dir = getDir();
      const fn1 = () => true;
      const fn2 = () => false;
      dir.addPredicate('role', fn1);
      dir.addPredicate('role', fn2);
      expect(dir.predicates().get('role')).toBe(fn2);
      expect(dir.activeCount()).toBe(1);
    });

    it('removePredicate removes a named predicate', () => {
      const dir = getDir();
      dir.addPredicate('role', () => true);
      dir.removePredicate('role');
      expect(dir.predicates().has('role')).toBe(false);
      expect(dir.activeCount()).toBe(0);
      expect(dir.isActive()).toBe(false);
    });

    it('removePredicate is a no-op for unknown key', () => {
      const dir = getDir();
      dir.addPredicate('role', () => true);
      dir.removePredicate('unknown');
      expect(dir.activeCount()).toBe(1);
    });

    it('predicate AND-combines multiple named predicates', () => {
      const dir = getDir();
      dir.addPredicate('minAge', (v: unknown) => (v as { age: number }).age >= 18);
      dir.addPredicate('hasName', (v: unknown) => !!(v as { name: string }).name);
      const combined = dir.predicate()!;
      expect(combined({ age: 20, name: 'Alice' })).toBe(true);
      expect(combined({ age: 20, name: '' })).toBe(false);
      expect(combined({ age: 10, name: 'Bob' })).toBe(false);
    });

    it('clear() removes all named predicates', () => {
      const dir = getDir();
      dir.addPredicate('a', () => true);
      dir.addPredicate('b', () => true);
      dir.clear();
      expect(dir.activeCount()).toBe(0);
      expect(dir.predicate()).toBeNull();
    });

    it('emits predicatesChange on addPredicate', () => {
      const dir = getDir();
      const spy = vi.fn();
      dir.predicatesChange.subscribe(spy);
      const fn = () => true;
      dir.addPredicate('role', fn);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].get('role')).toBe(fn);
    });

    it('emits predicatesChange on removePredicate', () => {
      const dir = getDir();
      dir.addPredicate('role', () => true);
      const spy = vi.fn();
      dir.predicatesChange.subscribe(spy);
      dir.removePredicate('role');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].size).toBe(0);
    });

    it('emits predicatesChange on clear()', () => {
      const dir = getDir();
      dir.addPredicate('a', () => true);
      const spy = vi.fn();
      dir.predicatesChange.subscribe(spy);
      dir.clear();
      expect(spy).toHaveBeenCalledWith(new Map());
    });

    it('setPredicate uses the default key and coexists with named predicates', () => {
      const dir = getDir();
      dir.addPredicate('role', (v: unknown) => (v as { role: string }).role === 'admin');
      dir.setPredicate((v: unknown) => !!(v as { name: string }).name);
      expect(dir.activeCount()).toBe(2);
      const combined = dir.predicate()!;
      expect(combined({ role: 'admin', name: 'Alice' })).toBe(true);
      expect(combined({ role: 'admin', name: '' })).toBe(false);
    });
  });
});
