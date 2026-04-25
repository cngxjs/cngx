import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Subject, type Observable } from 'rxjs';

import { CngxListbox, type ListboxMatchFn } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { CNGX_STATEFUL } from '@cngx/core/utils';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';

import { CngxCombobox, type CngxComboboxChange } from './combobox.component';
import { CngxComboboxChip } from '../shared/template-slots';
import {
  filterSelectOptions,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';

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
    expect(change!.previousValues).toEqual(['red', 'green']);
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

  it('clicking the trigger wrapper opens the panel and focuses the input', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const wrapper: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__trigger',
    );
    wrapper.click();
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

// ── Phase C — commit-flow producer (per-toggle [commitAction]) ────────

@Component({
  selector: 'commit-host',
  template: `
    <cngx-combobox
      [label]="'Tags'"
      [options]="options"
      [clearable]="true"
      [commitAction]="commitAction"
      [commitMode]="mode()"
      [(values)]="values"
      (commitError)="errors.push($event)"
      (stateChange)="statuses.push($event)"
      (selectionChange)="changes.push($event)"
      (optionToggled)="toggles.push($event)"
    />
  `,
  imports: [CngxCombobox],
})
class CommitHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  readonly mode = signal<CngxSelectCommitMode>('optimistic');
  readonly errors: unknown[] = [];
  readonly statuses: string[] = [];
  readonly changes: CngxComboboxChange<string>[] = [];
  readonly toggles: { option: CngxSelectOptionDef<string>; added: boolean }[] = [];
  pending: Subject<string[] | undefined> | null = null;
  commitCallCount = 0;
  readonly commitAction: CngxSelectCommitAction<string[]> = (intended) => {
    this.commitCallCount += 1;
    const subject = new Subject<string[] | undefined>();
    this.pending = subject;
    void intended;
    return subject.asObservable() as Observable<string[] | undefined>;
  };
}

describe('CngxCombobox — commit action producer', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [CommitHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<CommitHost>>;
    combo: CngxCombobox<string>;
    host: CommitHost;
    input: HTMLInputElement;
    optionAt: (idx: number) => HTMLElement;
  } {
    const fixture = TestBed.createComponent(CommitHost);
    fixture.detectChanges();
    flush(fixture);
    const comboDe = fixture.debugElement.query(By.directive(CngxCombobox));
    return {
      fixture,
      combo: comboDe.componentInstance as CngxCombobox<string>,
      host: fixture.componentInstance,
      input: comboDe.nativeElement.querySelector(
        '.cngx-combobox__input',
      ) as HTMLInputElement,
      optionAt: (idx) => {
        const options = comboDe.nativeElement.querySelectorAll('[cngxOption]');
        return options[idx] as HTMLElement;
      },
    };
  }

  it('optimistic success: values updated immediately, selectionChange on success', () => {
    const { fixture, host, combo, optionAt } = setup();
    combo.open();
    flush(fixture);
    optionAt(0).click();
    flush(fixture);

    expect(host.values()).toEqual(['red']);
    expect(host.changes).toEqual([]);
    expect(host.statuses[host.statuses.length - 1]).toBe('pending');

    host.pending!.next(['red']);
    host.pending!.complete();
    flush(fixture);

    expect(host.values()).toEqual(['red']);
    expect(host.changes.length).toBe(1);
    expect(host.changes[0].added).toEqual(['red']);
    expect(host.statuses[host.statuses.length - 1]).toBe('success');
  });

  it('optimistic error: values roll back to previous, commitError fires', () => {
    const { fixture, host, combo, optionAt } = setup();
    combo.open();
    flush(fixture);
    optionAt(0).click();
    flush(fixture);
    expect(host.values()).toEqual(['red']);

    const err = new Error('server down');
    host.pending!.error(err);
    flush(fixture);

    expect(host.values()).toEqual([]);
    expect(host.errors).toEqual([err]);
    expect(host.statuses[host.statuses.length - 1]).toBe('error');
  });

  it('pessimistic: panel stays open, togglingOption drives spinner, values deferred', () => {
    const { fixture, host, combo, optionAt } = setup();
    host.mode.set('pessimistic');
    flush(fixture);
    combo.open();
    flush(fixture);
    optionAt(0).click();
    flush(fixture);

    expect(host.values()).toEqual([]);
    expect(combo.isCommitting()).toBe(true);
    expect(combo.panelOpen()).toBe(true);

    host.pending!.next(['red']);
    host.pending!.complete();
    flush(fixture);

    expect(host.values()).toEqual(['red']);
    expect(combo.isCommitting()).toBe(false);
    expect(combo.panelOpen()).toBe(true);
  });

  it('pessimistic error: values stay at previous, panel remains open', () => {
    const { fixture, host, combo, optionAt } = setup();
    host.mode.set('pessimistic');
    flush(fixture);
    combo.open();
    flush(fixture);
    optionAt(0).click();
    flush(fixture);
    expect(host.values()).toEqual([]);

    host.pending!.error(new Error('nope'));
    flush(fixture);

    expect(host.values()).toEqual([]);
    expect(combo.panelOpen()).toBe(true);
    expect(host.statuses[host.statuses.length - 1]).toBe('error');
  });

  it('supersede: second toggle while first pending aborts the first callback', () => {
    const { fixture, host, combo, optionAt } = setup();
    combo.open();
    flush(fixture);
    optionAt(0).click();
    flush(fixture);
    const firstPending = host.pending!;
    const firstCount = host.commitCallCount;

    optionAt(1).click();
    flush(fixture);
    expect(host.commitCallCount).toBeGreaterThan(firstCount);

    const changesBefore = host.changes.length;
    firstPending.next(['red']);
    firstPending.complete();
    flush(fixture);
    expect(host.changes.length).toBe(changesBefore);
  });

  it('chip × with commitAction: optimistic rollback on reject restores value', () => {
    const { fixture, host } = setup();
    host.values.set(['red', 'green']);
    flush(fixture);
    const firstRemove: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-chip__remove',
    );
    firstRemove.click();
    flush(fixture);
    expect(host.values()).toEqual(['green']);

    host.pending!.error(new Error('retry'));
    flush(fixture);
    expect(host.values()).toEqual(['red', 'green']);
  });

  it('clear-all with commitAction: optimistic success empties, error rolls back', () => {
    const { fixture, host } = setup();
    host.values.set(['red', 'green']);
    flush(fixture);
    const clear: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__clear-all',
    );
    clear.click();
    flush(fixture);
    expect(host.values()).toEqual([]);

    host.pending!.error(new Error('nope'));
    flush(fixture);
    expect(host.values()).toEqual(['red', 'green']);
  });

  it('Backspace-remove with commitAction triggers the commit flow', () => {
    const { fixture, host } = setup();
    host.values.set(['red', 'green']);
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
    // Optimistic-default: green removed immediately.
    expect(host.values()).toEqual(['red']);
    // And a commit is in flight.
    expect(host.pending).not.toBeNull();
    expect(host.statuses[host.statuses.length - 1]).toBe('pending');
  });

  it('pessimistic commit + typing filter: commit survives filter change', () => {
    const { fixture, host, combo, input, optionAt } = setup();
    host.mode.set('pessimistic');
    flush(fixture);
    combo.open();
    flush(fixture);
    optionAt(0).click(); // commit pending on 'red'
    flush(fixture);

    // User types to filter — 'red' (Rot) stays, but 'green' / 'blue'
    // disappear from the rendered panel. The commit in flight is
    // orthogonal to the filter — it still completes on 'red'.
    input.focus();
    flush(fixture);
    setInputValue(input, 'gr');
    vi.useFakeTimers();
    vi.advanceTimersByTime(350);
    flush(fixture);
    vi.useRealTimers();

    expect(combo.isCommitting()).toBe(true);

    host.pending!.next(['red']);
    host.pending!.complete();
    flush(fixture);
    expect(host.values()).toEqual(['red']);
    expect(combo.isCommitting()).toBe(false);
  });

  it('effectiveOptions filter applies to [state]-async options', () => {
    @Component({
      template: `
        <cngx-combobox [label]="'Tags'" [state]="state" [(values)]="values" />
      `,
      imports: [CngxCombobox],
    })
    class AsyncFilterHost {
      readonly state: ManualAsyncState<CngxSelectOptionsInput<string>> =
        createManualState<CngxSelectOptionsInput<string>>();
      readonly values = signal<string[]>([]);
      constructor() {
        this.state.setSuccess(OPTIONS);
      }
    }
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(AsyncFilterHost);
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
    vi.useRealTimers();
  });

  it('CNGX_STATEFUL resolves to commitState', () => {
    const { fixture, combo } = setup();
    const stateful = fixture.debugElement
      .query(By.directive(CngxCombobox))
      .injector.get(CNGX_STATEFUL);
    expect(stateful.state).toBe(combo.commitState);
  });
});

// ── Phase C — a11y audit (nested buttons) ─────────────────────────────

describe('CngxCombobox — a11y', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  it('never nests a <button> inside another <button>, even with chips + clear + commit spinner', () => {
    @Component({
      template: `
        <cngx-combobox
          [label]="'Tags'"
          [options]="options"
          [clearable]="true"
          [commitAction]="commitAction"
          commitMode="pessimistic"
          [(values)]="values"
        />
      `,
      imports: [CngxCombobox],
    })
    class HeavyHost {
      readonly options = OPTIONS;
      readonly values = signal<string[]>(['red', 'green']);
      readonly commitAction: CngxSelectCommitAction<string[]> = () =>
        new Subject<string[] | undefined>().asObservable() as Observable<
          string[] | undefined
        >;
    }
    const fixture = TestBed.createComponent(HeavyHost);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    combo.open();
    flush(fixture);
    // Trigger a pessimistic commit so the option-row spinner renders.
    const option: HTMLElement = fixture.nativeElement.querySelector('[cngxOption]');
    option.click();
    flush(fixture);

    const nested = fixture.nativeElement.querySelectorAll('button button');
    expect(nested.length).toBe(0);
  });
});

// ── *cngxComboboxChip slot ────────────────────────────────────────────

@Component({
  template: `
    <cngx-combobox [label]="'Tags'" [options]="options" [(values)]="values">
      <ng-template cngxComboboxChip let-opt let-remove="remove" let-i="index">
        <span class="my-combo-tag" [attr.data-index]="i">
          <span class="my-combo-tag__label">{{ opt.label }}</span>
          <button type="button" class="my-combo-tag__close" (click)="remove()">×</button>
        </span>
      </ng-template>
    </cngx-combobox>
  `,
  imports: [CngxCombobox, CngxComboboxChip],
})
class ComboboxChipTemplateHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green']);
}

describe('CngxCombobox — *cngxComboboxChip slot', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  it('renders the chip template override instead of the default <cngx-chip>', () => {
    const fixture = TestBed.createComponent(ComboboxChipTemplateHost);
    flush(fixture);
    const defaults = fixture.nativeElement.querySelectorAll('cngx-chip');
    const customs = fixture.nativeElement.querySelectorAll('.my-combo-tag');
    expect(defaults.length).toBe(0);
    expect(customs.length).toBe(2);
    expect(customs[0].textContent).toContain('Rot');
    // index context field is forwarded for positional labels.
    expect(customs[0].getAttribute('data-index')).toBe('0');
    expect(customs[1].getAttribute('data-index')).toBe('1');
  });

  it('chip template remove() callback removes the value via the commit-aware path', () => {
    const fixture = TestBed.createComponent(ComboboxChipTemplateHost);
    flush(fixture);
    const firstClose: HTMLElement =
      fixture.nativeElement.querySelector('.my-combo-tag__close');
    firstClose.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['green']);
  });

  it('repeated chipRemoveFor(opt) calls return the same closure (WeakMap identity)', () => {
    const fixture = TestBed.createComponent(ComboboxChipTemplateHost);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string> & {
      chipRemoveFor: (opt: CngxSelectOptionDef<string>) => () => void;
    };
    const opt: CngxSelectOptionDef<string> = OPTIONS[0];
    expect(combo.chipRemoveFor(opt)).toBe(combo.chipRemoveFor(opt));
  });
});
