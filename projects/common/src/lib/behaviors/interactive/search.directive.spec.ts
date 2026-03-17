import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('updates term after input event (debounce=0)', fakeAsync(() => {
    const { el, dir } = setup();
    el.nativeElement.value = 'hello';
    el.triggerEventHandler('input', { target: el.nativeElement });
    tick(0);
    expect(dir.term()).toBe('hello');
    expect(dir.hasValue()).toBe(true);
  }));

  it('emits searchChange after input event', fakeAsync(() => {
    const { el, dir } = setup();
    const spy = vi.fn();
    dir.searchChange.subscribe(spy);
    el.nativeElement.value = 'test';
    el.triggerEventHandler('input', { target: el.nativeElement });
    tick(0);
    expect(spy).toHaveBeenCalledWith('test');
  }));

  it('clear() resets term to empty and emits', () => {
    const { dir } = setup();
    const spy = vi.fn();
    dir.searchChange.subscribe(spy);
    dir.clear();
    expect(dir.term()).toBe('');
    expect(spy).toHaveBeenCalledWith('');
  });
});
