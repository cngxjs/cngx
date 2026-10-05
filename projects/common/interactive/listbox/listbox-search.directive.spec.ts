import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxListboxSearch } from './listbox-search.directive';
import { CngxListbox } from './listbox.directive';
import { CngxOption } from './option.directive';

@Component({
  template: `
    <input cngxListboxSearch [debounceMs]="0" #search="cngxListboxSearch" />
    <div cngxListbox [label]="'Search host'" tabindex="0" #lb="cngxListbox">
      @for (f of options(); track f.value) {
        <div cngxOption [value]="f.value" [label]="f.label">{{ f.label }}</div>
      }
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxSearch],
})
class SearchHost {
  readonly options = signal([
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry' },
    { value: 'd', label: 'Apricot' },
  ]);
}

describe('CngxListboxSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [SearchHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<SearchHost>>;
    input: HTMLInputElement;
    search: CngxListboxSearch;
  } {
    const fixture = TestBed.createComponent(SearchHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(CngxListboxSearch));
    return {
      fixture,
      input: debugEl.nativeElement as HTMLInputElement,
      search: debugEl.injector.get(CngxListboxSearch),
    };
  }

  it('exposes term from underlying CngxSearch', () => {
    const { input, search, fixture } = setup();
    input.value = 'app';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(1);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(search.term()).toBe('app');
    expect(search.hasValue()).toBe(true);
  });

  it('uses default matchFn: case-insensitive label prefix or contains', () => {
    const { search } = setup();
    expect(
      search.matchFn()(
        { id: 'a', value: 'a', label: 'Apple' },
        'APP',
      ),
    ).toBe(true);
    expect(
      search.matchFn()(
        { id: 'b', value: 'b', label: 'Banana' },
        'APP',
      ),
    ).toBe(false);
  });

  it('ignores accents and invisible format characters in the default matchFn', () => {
    const { search } = setup();
    expect(search.matchFn()({ id: 'u', value: 'u', label: 'Über' }, 'uber')).toBe(true);
    expect(search.matchFn()({ id: 'e', value: 'e', label: 'Éclair' }, 'ecl')).toBe(true);
    const message = { id: 'm', value: 'm', label: '\u2068Anna\u2069 joined' };
    expect(search.matchFn()(message, 'anna')).toBe(true);
  });

  it('re-folds a cached option when its label or the term changes', () => {
    const { search } = setup();
    const match = search.matchFn();
    const option = { id: 'o', value: 'o', label: 'Äpfel' };
    expect(match(option, 'apf')).toBe(true);
    expect(match(option, 'bir')).toBe(false);
    option.label = 'Birnen';
    expect(match(option, 'bir')).toBe(true);
    expect(match(option, 'apf')).toBe(false);
  });
});
