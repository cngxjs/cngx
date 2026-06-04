import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxSearch } from './search.directive';

@Component({
  template: '<input cngxSearch [debounceMs]="debounce" />',
  imports: [CngxSearch],
})
class TestHost {
  debounce = 0;
}

describe('CngxSearch', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));
  afterEach(() => vi.useRealTimers());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('input'));
    const dir = el.injector.get(CngxSearch);
    return { fixture, el, dir };
  }

  it('starts with empty term', () => {
    const { dir } = setup();
    expect(dir.term()).toBe('');
    expect(dir.hasValue()).toBe(false);
  });

  it('updates term after input event (debounce=0)', () => {
    vi.useFakeTimers();
    const { el, dir } = setup();
    el.nativeElement.value = 'hello';
    el.nativeElement.dispatchEvent(new Event('input'));
    vi.runAllTimers();
    expect(dir.term()).toBe('hello');
    expect(dir.hasValue()).toBe(true);
  });

  it('emits searchChange after input event', () => {
    vi.useFakeTimers();
    const { el, dir } = setup();
    const spy = vi.fn();
    dir.searchChange.subscribe(spy);
    el.nativeElement.value = 'test';
    el.nativeElement.dispatchEvent(new Event('input'));
    vi.runAllTimers();
    expect(spy).toHaveBeenCalledWith('test');
  });

  it('clear() resets term to empty and emits', () => {
    const { dir } = setup();
    const spy = vi.fn();
    dir.searchChange.subscribe(spy);
    dir.clear();
    expect(dir.term()).toBe('');
    expect(spy).toHaveBeenCalledWith('');
  });
});
