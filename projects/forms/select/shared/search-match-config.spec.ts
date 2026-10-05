import { Component, signal, type Signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ListboxMatchFn } from '@cngx/common/interactive';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';
import { provideSelectConfig, provideSelectConfigAt, withSearchMatchFn } from './config';
import type { CngxSelectOptionDef } from './option.model';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Rot' },
  { value: 'green', label: 'Grün' },
  { value: 'blue', label: 'Blau' },
];

const ITEM = { id: 'x', value: 'green', label: 'Grün' };

const configMatch = vi.fn<ListboxMatchFn>(() => true);
const subtreeMatch = vi.fn<ListboxMatchFn>(() => false);
const inputMatch = vi.fn<ListboxMatchFn>(() => false);

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
  readonly matcher = signal<ListboxMatchFn | null>(null);
  readonly shellMatcher = signal<((value: string, label: string, term: string) => boolean) | null>(
    null,
  );
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
    expect(configMatch).toHaveBeenCalledWith({ id: '', value: 'green', label: 'Grün' }, 'gr');
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
