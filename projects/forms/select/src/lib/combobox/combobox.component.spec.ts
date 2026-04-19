import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxListbox, type ListboxMatchFn } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { CNGX_STATEFUL } from '@cngx/core/utils';

import { CngxCombobox, type CngxComboboxChange } from './combobox.component';
import {
  filterSelectOptions,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';

// jsdom has no Popover API — polyfill so CngxPopover can toggle.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.togglePopover = function (this: HTMLElement) {
      if (this.hasAttribute('data-popover-open')) {
        (this as HTMLElement & { hidePopover: () => void }).hidePopover();
        return false;
      }
      (this as HTMLElement & { showPopover: () => void }).showPopover();
      return true;
    };
  }
}

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Rot' },
  { value: 'green', label: 'Grün' },
  { value: 'blue', label: 'Blau', disabled: true },
];

@Component({
  template: `
    <cngx-combobox
      [label]="'Farbe'"
      [options]="options"
      [placeholder]="placeholder"
      [clearable]="clearable"
      [(values)]="values"
      (selectionChange)="lastChange.set($event)"
      (openedChange)="openedLog.set($event)"
    />
  `,
  imports: [CngxCombobox],
})
class Host {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  readonly placeholder = 'Themen suchen';
  clearable = false;
  readonly lastChange = signal<CngxComboboxChange<string> | null>(null);
  readonly openedLog = signal<boolean | null>(null);
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

beforeEach(() => {
  polyfillPopover();
});

describe('CngxCombobox — skeleton', () => {
  it('renders role="combobox" on the inner <input> and role="group" on the wrapper', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    expect(input).not.toBeNull();
    expect(input.getAttribute('role')).toBe('combobox');
    const wrapper: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__trigger',
    );
    expect(wrapper.getAttribute('role')).toBe('group');
  });

  it('forwards placeholder to the <input>', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    expect(input.placeholder).toBe('Themen suchen');
  });

  it('renders a chip per selected value with a remove button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const chips: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('cngx-chip'),
    );
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('Rot');
    expect(chips[1].textContent).toContain('Grün');
  });

  it('removes a value when its chip × is clicked', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const firstRemove: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-chip__remove',
    );
    firstRemove.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['green']);
    const change = fixture.componentInstance.lastChange();
    expect(change).not.toBeNull();
    expect(change!.action).toBe('toggle');
    expect(change!.removed).toEqual(['red']);
  });

  it('clear-all empties values and emits a clear-action selectionChange', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.clearable = true;
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const clear: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__clear-all',
    );
    expect(clear).not.toBeNull();
    clear.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual([]);
    const change = fixture.componentInstance.lastChange();
    expect(change!.action).toBe('clear');
    expect(change!.removed).toEqual(['red', 'green']);
  });

  it('isSelected uses the map fast-path with the default comparator', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string> & {
      isSelected: (opt: CngxSelectOptionDef<string>) => boolean;
    };
    expect(combo.isSelected(OPTIONS[0])).toBe(true);
    expect(combo.isSelected(OPTIONS[1])).toBe(false);
  });

  it('focusing the input opens the panel (openOnFocus=true)', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const input: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flush(fixture);
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    expect(popover.isVisible()).toBe(true);
  });

  it('open() / close() drive the panel imperatively', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    combo.open();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
    combo.close();
    flush(fixture);
    expect(popover.isVisible()).toBe(false);
  });

  it('provides CNGX_STATEFUL that resolves to commitState', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const stateful = fixture.debugElement
      .query(By.directive(CngxCombobox))
      .injector.get(CNGX_STATEFUL);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    expect(stateful.state).toBe(combo.commitState);
  });

  it('renders options via the shared panel (explicitOptions wiring)', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    combo.open();
    flush(fixture);
    const rows = fixture.nativeElement.querySelectorAll('[cngxOption]');
    expect(rows.length).toBe(3);
    const lb = fixture.debugElement
      .query(By.directive(CngxListbox))
      .injector.get(CngxListbox);
    expect(lb.options().length).toBe(3);
  });

  it('clicking an option while panel is open toggles it into values and keeps panel open', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    combo.open();
    flush(fixture);
    const firstOption: HTMLElement = fixture.nativeElement.querySelector(
      '[cngxOption]',
    );
    firstOption.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['red']);
    expect(combo.panelOpen()).toBe(true);
  });
});

// ── Phase B — search + filter + backspace + searchTermChange ──────────

function setInputValue(el: HTMLInputElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('filterSelectOptions (helper)', () => {
  it('returns the input unchanged for an empty term', () => {
    const all: CngxSelectOptionsInput<string> = OPTIONS;
    const match: ListboxMatchFn = (o, t) =>
      o.label.toLowerCase().includes(t.toLowerCase());
    expect(filterSelectOptions(all, '', match)).toBe(all);
  });

  it('filters flat options with the match fn', () => {
    const match: ListboxMatchFn = (o, t) =>
      o.label.toLowerCase().includes(t.toLowerCase());
    const out = filterSelectOptions(OPTIONS, 'ro', match);
    expect(out.map((o) => (o as CngxSelectOptionDef<string>).value)).toEqual(['red']);
  });

  it('drops groups whose children all fail the match', () => {
    const grouped: CngxSelectOptionsInput<string> = [
      {
        label: 'Warm',
        children: [
          { value: 'red', label: 'Rot' },
          { value: 'orange', label: 'Orange' },
        ],
      },
      {
        label: 'Kalt',
        children: [{ value: 'blue', label: 'Blau' }],
      },
    ];
    const match: ListboxMatchFn = (o, t) =>
      o.label.toLowerCase().includes(t.toLowerCase());
    const out = filterSelectOptions(grouped, 'rot', match);
    expect(out.length).toBe(1);
    const survivingGroup = out[0] as { label: string; children: CngxSelectOptionDef<string>[] };
    expect(survivingGroup.label).toBe('Warm');
    expect(survivingGroup.children.map((c) => c.value)).toEqual(['red']);
  });
});

describe('CngxCombobox — search + filter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    polyfillPopover();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('typing into the input filters the rendered option rows', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    flush(fixture);
    setInputValue(input, 'ro');
    vi.advanceTimersByTime(350);
    flush(fixture);
    const rows = fixture.nativeElement.querySelectorAll('[cngxOption]');
    expect(rows.length).toBe(1);
    expect((rows[0] as HTMLElement).textContent).toContain('Rot');
  });

  it('[skipInitial] suppresses the hydrate-time empty emission but lets user terms through', () => {
    @Component({
      template: `
        <cngx-combobox
          [label]="'Farbe'"
          [options]="options"
          [skipInitial]="true"
          (searchTermChange)="terms.push($event)"
        />
      `,
      imports: [CngxCombobox],
    })
    class SkipInitHost {
      readonly options = OPTIONS;
      readonly terms: string[] = [];
    }
    const fixture = TestBed.createComponent(SkipInitHost);
    flush(fixture);
    // No emission on mount.
    expect(fixture.componentInstance.terms).toEqual([]);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    flush(fixture);
    setInputValue(input, 'ro');
    vi.advanceTimersByTime(350);
    flush(fixture);
    expect(fixture.componentInstance.terms).toEqual(['ro']);
  });

  it('typing emits debounced (searchTermChange)', () => {
    @Component({
      template: `
        <cngx-combobox
          [label]="'Farbe'"
          [options]="options"
          (searchTermChange)="terms.push($event)"
        />
      `,
      imports: [CngxCombobox],
    })
    class SearchHost {
      readonly options = OPTIONS;
      readonly terms: string[] = [];
    }
    const fixture = TestBed.createComponent(SearchHost);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    flush(fixture);
    setInputValue(input, 'ro');
    vi.advanceTimersByTime(350);
    flush(fixture);
    expect(fixture.componentInstance.terms).toContain('ro');
  });

  it('custom [searchMatchFn] wins over the default substring match', () => {
    const startsWithG: ListboxMatchFn = (o, t) =>
      o.label.toLowerCase().startsWith(t.toLowerCase());
    @Component({
      template: `
        <cngx-combobox
          [label]="'Farbe'"
          [options]="options"
          [searchMatchFn]="matcher"
        />
      `,
      imports: [CngxCombobox],
    })
    class CustomMatchHost {
      readonly options = OPTIONS;
      readonly matcher = startsWithG;
    }
    const fixture = TestBed.createComponent(CustomMatchHost);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    flush(fixture);
    // "ru" would match "Grün" via substring, but not via startsWith.
    setInputValue(input, 'ru');
    vi.advanceTimersByTime(350);
    flush(fixture);
    const rows = fixture.nativeElement.querySelectorAll('[cngxOption]');
    expect(rows.length).toBe(0);
    // "gr" starts with matches "Grün".
    setInputValue(input, 'gr');
    vi.advanceTimersByTime(350);
    flush(fixture);
    const rows2 = fixture.nativeElement.querySelectorAll('[cngxOption]');
    expect(rows2.length).toBe(1);
    expect((rows2[0] as HTMLElement).textContent).toContain('Grün');
  });

  it('debounce interval honored via [searchDebounceMs]', () => {
    @Component({
      template: `
        <cngx-combobox
          [label]="'Farbe'"
          [options]="options"
          [searchDebounceMs]="800"
          (searchTermChange)="terms.push($event)"
        />
      `,
      imports: [CngxCombobox],
    })
    class DebounceHost {
      readonly options = OPTIONS;
      readonly terms: string[] = [];
    }
    const fixture = TestBed.createComponent(DebounceHost);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    flush(fixture);
    setInputValue(input, 'ro');
    vi.advanceTimersByTime(400);
    flush(fixture);
    expect(fixture.componentInstance.terms).not.toContain('ro');
    vi.advanceTimersByTime(500);
    flush(fixture);
    expect(fixture.componentInstance.terms).toContain('ro');
  });

  it('Backspace on empty input removes the last chip', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    flush(fixture);
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['red']);
    const change = fixture.componentInstance.lastChange();
    expect(change!.removed).toEqual(['green']);
  });

  it('Backspace while input has text does NOT remove a chip', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    input.value = 'g';
    flush(fixture);
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['red', 'green']);
  });

  it('typing re-opens the panel after Escape-dismiss', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    combo.open();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
    // Escape closes.
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    flush(fixture);
    expect(popover.isVisible()).toBe(false);
    // Typing re-opens.
    setInputValue(input, 'ro');
    vi.advanceTimersByTime(350);
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
  });

  it('grouped options: empty groups are dropped by the live filter', () => {
    @Component({
      template: `
        <cngx-combobox [label]="'Farbe'" [options]="options" />
      `,
      imports: [CngxCombobox],
    })
    class GroupHost {
      readonly options: CngxSelectOptionsInput<string> = [
        {
          label: 'Warm',
          children: [
            { value: 'red', label: 'Rot' },
            { value: 'orange', label: 'Orange' },
          ],
        },
        {
          label: 'Kalt',
          children: [{ value: 'blue', label: 'Blau' }],
        },
      ];
    }
    const fixture = TestBed.createComponent(GroupHost);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    flush(fixture);
    setInputValue(input, 'rot');
    vi.advanceTimersByTime(350);
    flush(fixture);
    const groups = fixture.nativeElement.querySelectorAll('.cngx-select__group');
    // Only the Warm group survives (has a matching "Rot").
    expect(groups.length).toBe(1);
    const header = groups[0].querySelector('.cngx-select__group-header');
    expect(header!.textContent!.trim()).toBe('Warm');
  });
});
