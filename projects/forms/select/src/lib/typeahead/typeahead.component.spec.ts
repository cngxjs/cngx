import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';

import { CngxTypeahead } from './typeahead.component';
import type { CngxSelectOptionsInput } from '../shared/option.model';
import type { CngxSelectCommitAction } from '../shared/commit-action.types';

type User = { readonly id: number; readonly name: string };

const USERS: CngxSelectOptionsInput<User> = [
  { value: { id: 1, name: 'Alice' }, label: 'Alice' },
  { value: { id: 2, name: 'Bob' }, label: 'Bob' },
  { value: { id: 3, name: 'Charlie' }, label: 'Charlie' },
];

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => void;
  };
  if (!proto.showPopover) {
    proto.showPopover = function (this: HTMLElement): void {
      this.setAttribute('data-popover-shown', 'true');
      Object.defineProperty(this, 'matches', {
        value: (s: string) => s === ':popover-open',
        configurable: true,
      });
    };
    proto.hidePopover = function (this: HTMLElement): void {
      this.removeAttribute('data-popover-shown');
      Object.defineProperty(this, 'matches', {
        value: (_s: string) => false,
        configurable: true,
      });
    };
    proto.togglePopover = function (this: HTMLElement): void {
      if (this.getAttribute('data-popover-shown') === 'true') {
        proto.hidePopover!.call(this);
      } else {
        proto.showPopover!.call(this);
      }
    };
  }
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
}

// ── Standalone host ────────────────────────────────────────────────────

@Component({
  template: `
    <cngx-typeahead
      [label]="label"
      [options]="options"
      [compareWith]="compareWith"
      [displayWith]="displayWith"
      [clearOnBlur]="clearOnBlur"
      [clearable]="clearable"
      [commitAction]="commitAction"
      [commitMode]="commitMode"
      [(value)]="value"
      (selectionChange)="onChange($event)"
      (searchTermChange)="onSearch($event)"
    />
  `,
  imports: [CngxTypeahead],
})
class StandaloneHost {
  readonly label = 'User';
  readonly options = USERS;
  readonly compareWith: (a: User | undefined, b: User | undefined) => boolean =
    (a, b) => (a?.id ?? NaN) === (b?.id ?? NaN);
  readonly displayWith: (u: User) => string = (u) => u.name;
  readonly clearOnBlur = true;
  readonly clearable = false;
  readonly commitAction: CngxSelectCommitAction<User> | null = null;
  readonly commitMode: 'optimistic' | 'pessimistic' = 'optimistic';
  readonly value = signal<User | undefined>(undefined);
  readonly changeLog: User[] = [];
  readonly searchLog: string[] = [];
  onChange(ev: { value: User | undefined }): void {
    if (ev.value !== undefined) {
      this.changeLog.push(ev.value);
    }
  }
  onSearch(term: string): void {
    this.searchLog.push(term);
  }
}

// ── Form-field host ────────────────────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-typeahead
        [label]="'Farbe'"
        [options]="options"
        [displayWith]="displayWith"
      />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxTypeahead],
})
class FieldHost {
  readonly options: CngxSelectOptionsInput<string> = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  readonly displayWith = (s: string): string => s.toUpperCase();
  readonly _mock = createMockField<string>({ name: 'color', value: 'red' });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string> = this._mock.ref;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('CngxTypeahead — standalone', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [StandaloneHost] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<StandaloneHost>>;
    host: StandaloneHost;
    typeahead: CngxTypeahead<User>;
    input: HTMLInputElement;
  } {
    const fixture = TestBed.createComponent(StandaloneHost);
    flush(fixture);
    const typeahead = fixture.debugElement.query(By.directive(CngxTypeahead))
      .componentInstance as CngxTypeahead<User>;
    const input = fixture.nativeElement.querySelector('input.cngx-typeahead__input') as HTMLInputElement;
    return { fixture, host: fixture.componentInstance, typeahead, input };
  }

  it('renders an <input role="combobox" aria-autocomplete="list">', () => {
    const { input } = setup();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('renders aria-expanded=false initially', () => {
    const { input } = setup();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('is empty() and value() is undefined initially', () => {
    const { typeahead } = setup();
    expect(typeahead.value()).toBeUndefined();
    expect(typeahead.empty()).toBe(true);
  });

  it('setting value writes displayWith(value) into the input on next render', async () => {
    const { fixture, host, input } = setup();
    host.value.set({ id: 2, name: 'Bob' });
    flush(fixture);
    expect(input.value).toBe('Bob');
  });

  it('setting value to undefined clears the input', () => {
    const { fixture, host, input } = setup();
    host.value.set({ id: 2, name: 'Bob' });
    flush(fixture);
    expect(input.value).toBe('Bob');
    host.value.set(undefined);
    flush(fixture);
    expect(input.value).toBe('');
  });

  it('panelOpen flips true when open() is called', () => {
    const { fixture, typeahead } = setup();
    expect(typeahead.panelOpen()).toBe(false);
    typeahead.open();
    flush(fixture);
    expect(typeahead.panelOpen()).toBe(true);
  });

  it('toggle() cycles panel state', () => {
    const { fixture, typeahead } = setup();
    typeahead.toggle();
    flush(fixture);
    expect(typeahead.panelOpen()).toBe(true);
    typeahead.toggle();
    flush(fixture);
    expect(typeahead.panelOpen()).toBe(false);
  });

  it('close() hides the panel', () => {
    const { fixture, typeahead } = setup();
    typeahead.open();
    flush(fixture);
    typeahead.close();
    flush(fixture);
    expect(typeahead.panelOpen()).toBe(false);
  });

  it('focus() moves DOM focus onto the input', () => {
    const { typeahead, input } = setup();
    typeahead.focus();
    expect(document.activeElement).toBe(input);
  });

  it('selected computed resolves the current value against the option list', () => {
    const { fixture, host, typeahead } = setup();
    expect(typeahead.selected()).toBeNull();
    host.value.set({ id: 3, name: 'Charlie' });
    flush(fixture);
    expect(typeahead.selected()?.label).toBe('Charlie');
  });

  it('errorState is false without a form-field presenter', () => {
    const { typeahead } = setup();
    expect(typeahead.errorState()).toBe(false);
  });
});

// ── Form-field integration ─────────────────────────────────────────────

describe('CngxTypeahead — form-field integration', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [FieldHost] });
  });

  it('syncs initial field value into the typeahead', () => {
    const fixture = TestBed.createComponent(FieldHost);
    flush(fixture);
    const typeahead = fixture.debugElement.query(By.directive(CngxTypeahead))
      .componentInstance as CngxTypeahead<string>;
    expect(typeahead.value()).toBe('red');
  });

  it('displays displayWith(value) in the input (upper-cased via custom formatter)', () => {
    const fixture = TestBed.createComponent(FieldHost);
    flush(fixture);
    const input = fixture.nativeElement.querySelector('input.cngx-typeahead__input') as HTMLInputElement;
    expect(input.value).toBe('RED');
  });

  it('external field mutation reflects in the typeahead value + input text', () => {
    const fixture = TestBed.createComponent(FieldHost);
    flush(fixture);
    fixture.componentInstance.ref.value.set('green');
    flush(fixture);
    const typeahead = fixture.debugElement.query(By.directive(CngxTypeahead))
      .componentInstance as CngxTypeahead<string>;
    const input = fixture.nativeElement.querySelector('input.cngx-typeahead__input') as HTMLInputElement;
    expect(typeahead.value()).toBe('green');
    expect(input.value).toBe('GREEN');
  });
});

// ── clearOnBlur ────────────────────────────────────────────────────────

describe('CngxTypeahead — clearOnBlur', () => {
  @Component({
    template: `
      <cngx-typeahead
        [options]="options"
        [displayWith]="displayWith"
        [clearOnBlur]="clearOnBlur()"
        [(value)]="value"
      />
    `,
    imports: [CngxTypeahead],
  })
  class ClearOnBlurHost {
    readonly options = USERS;
    readonly displayWith = (u: User): string => u.name;
    readonly clearOnBlur: WritableSignal<boolean> = signal(true);
    readonly value = signal<User | undefined>({ id: 1, name: 'Alice' });
  }

  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [ClearOnBlurHost] });
  });

  it('on blur with stray text, clearOnBlur=true restores displayWith(value)', () => {
    const fixture = TestBed.createComponent(ClearOnBlurHost);
    flush(fixture);
    const input = fixture.nativeElement.querySelector('input.cngx-typeahead__input') as HTMLInputElement;
    expect(input.value).toBe('Alice');
    // User types stray text without picking an option.
    input.value = 'zzz-stray';
    input.focus();
    input.blur();
    flush(fixture);
    expect(input.value).toBe('Alice');
  });
});
