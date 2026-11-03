import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

  it('clear cancels a pending debounce', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.debounce = 300;
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('input'));
    const dir = el.injector.get(CngxSearch);
    const spy = vi.fn();
    dir.searchChange.subscribe(spy);
    el.nativeElement.value = 'stale';
    el.nativeElement.dispatchEvent(new Event('input'));
    dir.clear();
    vi.advanceTimersByTime(300);
    expect(dir.term()).toBe('');
    expect(spy.mock.calls).toEqual([['']]);
  });

  describe('flush and cancel', () => {
    function mountDebounced() {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.debounce = 300;
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('input'));
      const dir = el.injector.get(CngxSearch);
      const spy = vi.fn();
      dir.searchChange.subscribe(spy);
      const type = (value: string) => {
        el.nativeElement.value = value;
        el.nativeElement.dispatchEvent(new Event('input'));
      };
      return { el, dir, spy, type };
    }

    it('flush() emits the pending term at once and nothing after the window', () => {
      const { dir, spy, type } = mountDebounced();
      type('ber');
      expect(dir.flush()).toBe(true);
      expect(dir.term()).toBe('ber');
      expect(spy.mock.calls).toEqual([['ber']]);
      vi.advanceTimersByTime(1000);
      expect(spy.mock.calls).toEqual([['ber']]);
    });

    it('flush() without a pending term emits nothing and returns false', () => {
      const { dir, spy, type } = mountDebounced();
      expect(dir.flush()).toBe(false);
      type('ber');
      vi.advanceTimersByTime(300);
      expect(dir.flush()).toBe(false);
      expect(spy.mock.calls).toEqual([['ber']]);
    });

    it('cancel() drops the pending term and keeps the last emitted one', () => {
      const { el, dir, spy, type } = mountDebounced();
      type('ber');
      vi.advanceTimersByTime(300);
      type('berl');
      expect(dir.cancel()).toBe(true);
      vi.advanceTimersByTime(1000);
      expect(dir.term()).toBe('ber');
      expect(spy.mock.calls).toEqual([['ber']]);
      expect(el.nativeElement.value).toBe('berl');
      expect(dir.cancel()).toBe(false);
    });

    it('a new keystroke after cancel() debounces again', () => {
      const { dir, spy, type } = mountDebounced();
      type('b');
      dir.cancel();
      type('be');
      vi.advanceTimersByTime(300);
      expect(dir.term()).toBe('be');
      expect(spy.mock.calls).toEqual([['be']]);
    });

    it('emits synchronously when debounceMs is 0', () => {
      const { el, dir } = setup();
      el.nativeElement.value = 'now';
      el.nativeElement.dispatchEvent(new Event('input'));
      expect(dir.term()).toBe('now');
      expect(dir.flush()).toBe(false);
    });
  });
});
