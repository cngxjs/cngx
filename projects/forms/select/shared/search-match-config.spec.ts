import { Component, signal, type Signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxListboxSearch, CngxOption, type ListboxMatchFn } from '@cngx/common/interactive';

import { CngxSelectOption } from '../declarative/option.component';
import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';
import {
  provideSelectConfig,
  provideSelectConfigAt,
  withSearchMatchFn,
  type CngxSelectMatchFn,
  type CngxSelectMatchOption,
} from './config';
import type { CngxSelectOptionDef } from './option.model';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Rot' },
  { value: 'green', label: 'Grün' },
  { value: 'blue', label: 'Blau' },
];

const ITEM = { id: 'x', value: 'green', label: 'Grün' };

const configMatch = vi.fn<CngxSelectMatchFn>(() => true);
const subtreeMatch = vi.fn<CngxSelectMatchFn>(() => false);
const inputMatch = vi.fn<CngxSelectMatchFn>(() => false);

// A select matcher works where a listbox matcher is expected: a listbox item
// satisfies the `{ value, label }` option shape, so the variants pass their
// items straight through.
const asListboxMatch: ListboxMatchFn = configMatch;

type ShellMatchFn = NonNullable<ReturnType<CngxSelectShell<string>['searchMatchFn']>>;
const shellStartsWith: ShellMatchFn = (option, term) => option.value.startsWith(term);
// @ts-expect-error the pre-0.1 `(value, label, term)` shell matcher shape is gone
const legacyShellMatch: ShellMatchFn = (value: string, label: string, term: string) =>
  label.includes(term) || value === term;

// Every searchable variant types its matcher with the host's T, so a
// value-aware matcher compiles without a cast and a wrongly typed one fails.
type MatchFnOf<C extends { searchMatchFn: () => unknown }> = NonNullable<
  ReturnType<C['searchMatchFn']>
>;
const comboboxByValue: MatchFnOf<CngxCombobox<string>> = (o, t) => o.value.startsWith(t);
const typeaheadByValue: MatchFnOf<CngxTypeahead<string>> = (o, t) => o.value.startsWith(t);
const actionSelectByValue: MatchFnOf<CngxActionSelect<string>> = (o, t) => o.value.startsWith(t);
const actionMultiByValue: MatchFnOf<CngxActionMultiSelect<string>> = (o, t) =>
  o.value.startsWith(t);
// @ts-expect-error a CngxCombobox<string> matcher receives a string value, not a number
const comboboxWrongValue: MatchFnOf<CngxCombobox<string>> = (o: {
  readonly value: number;
  readonly label: string;
}) => o.value > 0;
// @ts-expect-error a CngxActionMultiSelect<string> matcher receives a string value
const actionMultiWrongValue: MatchFnOf<CngxActionMultiSelect<string>> = (o: {
  readonly value: number;
  readonly label: string;
}) => o.value > 0;
const TYPED_MATCHERS = [
  comboboxByValue,
  typeaheadByValue,
  actionSelectByValue,
  actionMultiByValue,
  comboboxWrongValue,
  actionMultiWrongValue,
];

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => boolean;
  };
  if (typeof proto.showPopover === 'function') {
    return;
  }
  proto.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-popover-open', 'true');
    this.dispatchEvent(new Event('toggle', { bubbles: false }));
  };
  proto.hidePopover = function (this: HTMLElement) {
    this.removeAttribute('data-popover-open');
    this.dispatchEvent(new Event('toggle', { bubbles: false }));
  };
  proto.togglePopover = function (this: HTMLElement) {
    const open = this.hasAttribute('data-popover-open');
    if (open) {
      this.removeAttribute('data-popover-open');
    } else {
      this.setAttribute('data-popover-open', 'true');
    }
    return !open;
  };
}

type Searchable = { readonly effectiveMatchFn: Signal<ListboxMatchFn> };

@Component({
  template: `
    <cngx-combobox [label]="'L'" [options]="options" [searchMatchFn]="matcher()" />
    <cngx-typeahead [label]="'L'" [options]="options" [searchMatchFn]="matcher()" />
    <cngx-action-select [label]="'L'" [options]="options" [searchMatchFn]="matcher()" />
    <cngx-action-multi-select [label]="'L'" [options]="options" [searchMatchFn]="matcher()" />
    <cngx-select-shell [label]="'L'" [searchMatchFn]="shellMatcher()" />
  `,
  imports: [CngxCombobox, CngxTypeahead, CngxActionSelect, CngxActionMultiSelect, CngxSelectShell],
})
class RootHost {
  readonly options = OPTIONS;
  readonly matcher = signal<CngxSelectMatchFn<string> | null>(null);
  readonly shellMatcher = signal<CngxSelectMatchFn<string> | null>(null);
}

@Component({
  template: `
    <cngx-combobox [label]="'L'" [options]="options" />
    <cngx-select-shell [label]="'L'" />
  `,
  imports: [CngxCombobox, CngxSelectShell],
  providers: [provideSelectConfigAt(withSearchMatchFn(subtreeMatch))],
})
class SubtreeHost {
  readonly options = OPTIONS;
}

@Component({
  template: `
    <cngx-select-shell [label]="'L'" [searchMatchFn]="matcher()" [(searchTerm)]="term">
      <cngx-option [value]="'red'" [label]="'Rot'">Rot</cngx-option>
      <cngx-option [value]="'green'" [label]="label()">{{ label() }}</cngx-option>
    </cngx-select-shell>
  `,
  imports: [CngxSelectShell, CngxSelectOption],
})
class ProjectedShellHost {
  readonly matcher = signal<CngxSelectMatchFn<string> | null>(null);
  readonly term = signal('');
  readonly label = signal('Grün');
}

const VARIANTS: readonly Type<unknown>[] = [
  CngxCombobox,
  CngxTypeahead,
  CngxActionSelect,
  CngxActionMultiSelect,
];

function matcherOf<C>(fixture: ComponentFixture<C>, type: Type<unknown>) {
  const instance = fixture.debugElement.query(By.directive(type)).componentInstance as Searchable;
  return instance.effectiveMatchFn();
}

function shellOf<C>(fixture: ComponentFixture<C>): CngxSelectShell<string> {
  return fixture.debugElement.query(By.directive(CngxSelectShell)).componentInstance;
}

describe('CngxSelectConfig.searchMatchFn', () => {
  beforeEach(() => {
    polyfillPopover();
    configMatch.mockClear();
    subtreeMatch.mockClear();
    inputMatch.mockClear();
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withSearchMatchFn(configMatch))],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('applies the config matcher to every searchable variant without an input', () => {
    const fixture = TestBed.createComponent(RootHost);
    fixture.detectChanges();
    for (const type of VARIANTS) {
      expect(matcherOf(fixture, type)).toBe(configMatch);
    }
    expect(shellOf(fixture).matches('green', 'Grün', 'gr')).toBe(true);
    expect(configMatch).toHaveBeenCalledWith({ value: 'green', label: 'Grün' }, 'gr');
    expect(configMatch.mock.calls[0][0]).not.toHaveProperty('id');
  });

  it('lets a per-instance [searchMatchFn] win over the config matcher', () => {
    const fixture = TestBed.createComponent(RootHost);
    fixture.componentInstance.matcher.set(inputMatch);
    fixture.componentInstance.shellMatcher.set(() => false);
    fixture.detectChanges();
    for (const type of VARIANTS) {
      expect(matcherOf(fixture, type)).toBe(inputMatch);
    }
    expect(shellOf(fixture).matches('green', 'Grün', 'gr')).toBe(false);
    expect(configMatch).not.toHaveBeenCalled();
  });

  it('passes the shell option as { value, label } to a [searchMatchFn]', () => {
    const fixture = TestBed.createComponent(RootHost);
    const shellMatch = vi.fn<CngxSelectMatchFn<string>>(shellStartsWith);
    fixture.componentInstance.shellMatcher.set(shellMatch);
    fixture.detectChanges();
    expect(shellOf(fixture).matches('green', 'Grün', 'gr')).toBe(true);
    expect(shellOf(fixture).matches('green', 'Grün', 'bl')).toBe(false);
    expect(shellMatch).toHaveBeenCalledWith({ value: 'green', label: 'Grün' }, 'gr');
    expect(shellMatch.mock.calls[0][0]).not.toHaveProperty('id');
    expect(configMatch).not.toHaveBeenCalled();
  });

  it('accepts a CngxSelectMatchFn on every searchable variant and filters through it', () => {
    const fixture = TestBed.createComponent(RootHost);
    const byValue: CngxSelectMatchFn = (option, term) => option.value === term;
    fixture.componentInstance.matcher.set(byValue);
    fixture.detectChanges();
    for (const type of VARIANTS) {
      const match = matcherOf(fixture, type);
      expect(match).toBe(byValue);
      expect(match(ITEM, 'green')).toBe(true);
      expect(match(ITEM, 'red')).toBe(false);
    }
    expect(asListboxMatch).toBe(configMatch);
    expect(legacyShellMatch).toBeTypeOf('function');
  });

  it('binds the typed matcher to the listbox search input unchanged', () => {
    const fixture = TestBed.createComponent(RootHost);
    fixture.componentInstance.matcher.set(comboboxByValue);
    fixture.detectChanges();
    for (const type of VARIANTS) {
      const host = fixture.debugElement.query(By.directive(type));
      const search = host.query(By.directive(CngxListboxSearch)).injector.get(CngxListboxSearch);
      expect(search.matchFn()).toBe(comboboxByValue);
      expect(search.matchFn()(ITEM, 'gre')).toBe(true);
      expect(search.matchFn()(ITEM, 'Gr')).toBe(false);
    }
    expect(TYPED_MATCHERS).toHaveLength(6);
  });

  it('hands a shell matcher one stable record per projected option on both paths', () => {
    const fixture = TestBed.createComponent(ProjectedShellHost);
    const seen: CngxSelectMatchOption<string>[] = [];
    fixture.componentInstance.matcher.set((option, term) => {
      seen.push(option);
      return option.label.toLowerCase().includes(term);
    });
    fixture.detectChanges();
    const shell = shellOf(fixture);
    const options = fixture.debugElement
      .queryAll(By.directive(CngxOption))
      .map((d) => d.injector.get(CngxOption));

    fixture.componentInstance.term.set('r');
    fixture.detectChanges();
    expect(options.map((o) => o.hidden())).toEqual([false, false]);
    fixture.componentInstance.term.set('ro');
    fixture.detectChanges();
    expect(options.map((o) => o.hidden())).toEqual([false, true]);

    const red = seen.filter((o) => o.value === 'red');
    const green = seen.filter((o) => o.value === 'green');
    // Model filter run + per-option `hidden`, for two terms.
    expect(red.length).toBeGreaterThanOrEqual(4);
    expect(red.every((o) => o === red[0])).toBe(true);
    expect(green.every((o) => o === green[0])).toBe(true);
    expect(red[0]).toEqual({ value: 'red', label: 'Rot' });
    expect(seen.some((o) => 'id' in o)).toBe(false);
    expect(shell.matches('red', 'Rot', 'ro', options[0])).toBe(true);
    expect(seen.at(-1)).toBe(red[0]);

    fixture.componentInstance.label.set('Grau');
    fixture.detectChanges();
    const renamed = seen.filter((o) => o.value === 'green').at(-1);
    expect(renamed).not.toBe(green[0]);
    expect(renamed).toEqual({ value: 'green', label: 'Grau' });
  });

  it('lets the default shell match reuse its fold cache across filter runs', () => {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(ProjectedShellHost);
    fixture.detectChanges();
    fixture.componentInstance.term.set('r');
    fixture.detectChanges();
    const normalize = vi.spyOn(String.prototype, 'normalize');
    try {
      fixture.componentInstance.term.set('ro');
      fixture.detectChanges();
      // Only the new term is folded; both labels come from the per-record cache.
      expect(normalize).toHaveBeenCalledTimes(1);
    } finally {
      normalize.mockRestore();
    }
  });

  it('reads the matcher of a provideSelectConfigAt subtree', () => {
    const fixture = TestBed.createComponent(SubtreeHost);
    fixture.detectChanges();
    expect(matcherOf(fixture, CngxCombobox)).toBe(subtreeMatch);
    expect(shellOf(fixture).matches('green', 'Grün', 'gr')).toBe(false);
    expect(subtreeMatch).toHaveBeenCalled();
    expect(configMatch).not.toHaveBeenCalled();
  });

  it('keeps the folded label match when no tier sets a matcher', () => {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(RootHost);
    fixture.detectChanges();
    for (const type of VARIANTS) {
      const match = matcherOf(fixture, type);
      expect(match(ITEM, 'GRUN')).toBe(true);
      expect(match(ITEM, 'blau')).toBe(false);
    }
    expect(shellOf(fixture).matches('green', 'Grün', 'GRUN')).toBe(true);
  });
});
