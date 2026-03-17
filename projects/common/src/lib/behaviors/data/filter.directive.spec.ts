import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxFilter } from './filter.directive';

@Component({
  template: '<div cngxFilter></div>',
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
  });

  it('setPredicate activates the filter', () => {
    const dir = getDir();
    const fn = (v: unknown) => !!v;
    dir.setPredicate(fn);
    expect(dir.predicate()).toBe(fn);
    expect(dir.isActive()).toBe(true);
  });

  it('clear() removes the predicate', () => {
    const dir = getDir();
    dir.setPredicate(() => true);
    dir.clear();
    expect(dir.predicate()).toBeNull();
    expect(dir.isActive()).toBe(false);
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
});
