import { Component, signal, viewChild, type TemplateRef, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';

import { describeCommitControllerCascade } from '../shared/__test-helpers/commit-controller-cascade';
import { CngxTypeahead } from './typeahead.component';
import type { CngxSelectOptionsInput } from '../shared/option.model';
import type { CngxSelectCommitAction } from '../shared/commit-action.types';
import { provideSelectConfig, withTypeaheadDebounce } from '../shared/config';
import { CngxSelectInputPrefix, CngxSelectInputSuffix } from '../shared/template-slots';

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

  it('selectionChange clearCallback emits previousValue = prior value', () => {
    const { fixture, host, typeahead } = setup();
    host.value.set({ id: 2, name: 'Bob' });
    flush(fixture);
    const events: Array<{ value: { name: string } | undefined; previousValue?: { name: string } | undefined }> = [];
    typeahead.selectionChange.subscribe((e) =>
      events.push({ value: e.value, previousValue: e.previousValue }),
    );
    (typeahead as unknown as { clearCallback: () => void }).clearCallback();
    flush(fixture);
    expect(events.at(-1)?.value).toBeUndefined();
    expect(events.at(-1)?.previousValue?.name).toBe('Bob');
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

// ── Config cascade — searchDebounceMs honors typeaheadDebounceInterval ─

describe('CngxTypeahead — searchDebounceMs config integration', () => {
  @Component({
    template: `<cngx-typeahead [options]="options" />`,
    imports: [CngxTypeahead],
  })
  class ConfigHost {
    readonly options: CngxSelectOptionsInput<string> = [{ value: 'a', label: 'A' }];
  }

  beforeEach(() => polyfillPopover());

  it('default searchDebounceMs is pulled from CNGX_SELECT_CONFIG (300ms when unset)', () => {
    TestBed.configureTestingModule({ imports: [ConfigHost] });
    const fixture = TestBed.createComponent(ConfigHost);
    flush(fixture);
    const typeahead = fixture.debugElement.query(By.directive(CngxTypeahead))
      .componentInstance as CngxTypeahead<string>;
    expect(typeahead.searchDebounceMs()).toBe(300);
  });

  it('app-scope provideSelectConfig(withTypeaheadDebounce(ms)) overrides the default', () => {
    TestBed.configureTestingModule({
      imports: [ConfigHost],
      providers: [provideSelectConfig(withTypeaheadDebounce(500))],
    });
    const fixture = TestBed.createComponent(ConfigHost);
    flush(fixture);
    const typeahead = fixture.debugElement.query(By.directive(CngxTypeahead))
      .componentInstance as CngxTypeahead<string>;
    expect(typeahead.searchDebounceMs()).toBe(500);
  });
});

// ── Glyph-slot & input-prefix/suffix pattern ────────────────────────────

describe('CngxTypeahead — glyph inputs + input prefix/suffix', () => {
  @Component({
    template: `
      <ng-template #myClear><span data-custom="clear">🗑</span></ng-template>
      <ng-template #myCaret><span data-custom="caret">⮟</span></ng-template>
      <cngx-typeahead
        [options]="options"
        [clearable]="true"
        [clearGlyph]="activeClear()"
        [caretGlyph]="activeCaret()"
        [(value)]="value"
      />
    `,
    imports: [CngxTypeahead],
  })
  class GlyphHost {
    readonly options = USERS;
    readonly clearTpl = viewChild.required<TemplateRef<void>>('myClear');
    readonly caretTpl = viewChild.required<TemplateRef<void>>('myCaret');
    readonly activeClear: WritableSignal<TemplateRef<void> | null> = signal(null);
    readonly activeCaret: WritableSignal<TemplateRef<void> | null> = signal(null);
    readonly value: WritableSignal<User | undefined> = signal({ id: 1, name: 'Alice' });
  }

  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [GlyphHost] });
  });

  it('default clear button renders the built-in ✕ glyph', () => {
    const fixture = TestBed.createComponent(GlyphHost);
    flush(fixture);
    const clearBtn = fixture.nativeElement.querySelector('button.cngx-typeahead__clear') as HTMLElement;
    expect(clearBtn.textContent?.trim()).toBe('✕');
    expect(clearBtn.querySelector('[data-custom="clear"]')).toBeNull();
  });

  it('[clearGlyph] replaces the built-in ✕ while keeping the button frame + aria-label', () => {
    const fixture = TestBed.createComponent(GlyphHost);
    flush(fixture);
    fixture.componentInstance.activeClear.set(fixture.componentInstance.clearTpl());
    flush(fixture);
    const clearBtn = fixture.nativeElement.querySelector('button.cngx-typeahead__clear') as HTMLElement;
    expect(clearBtn.querySelector('[data-custom="clear"]')).not.toBeNull();
    expect(clearBtn.textContent?.trim()).toBe('🗑');
    expect(clearBtn.getAttribute('aria-label')).toBe('Reset selection');
  });

  it('[caretGlyph] replaces the built-in ▾ inside the caret span', () => {
    const fixture = TestBed.createComponent(GlyphHost);
    flush(fixture);
    fixture.componentInstance.activeCaret.set(fixture.componentInstance.caretTpl());
    flush(fixture);
    const caret = fixture.nativeElement.querySelector('.cngx-typeahead__caret') as HTMLElement;
    expect(caret.querySelector('[data-custom="caret"]')).not.toBeNull();
  });

  it('resetting glyph input to null restores the built-in glyph', () => {
    const fixture = TestBed.createComponent(GlyphHost);
    flush(fixture);
    fixture.componentInstance.activeClear.set(fixture.componentInstance.clearTpl());
    flush(fixture);
    fixture.componentInstance.activeClear.set(null);
    flush(fixture);
    const clearBtn = fixture.nativeElement.querySelector('button.cngx-typeahead__clear') as HTMLElement;
    expect(clearBtn.querySelector('[data-custom="clear"]')).toBeNull();
    expect(clearBtn.textContent?.trim()).toBe('✕');
  });

  @Component({
    template: `
      <cngx-typeahead [options]="options">
        <ng-template cngxSelectInputPrefix let-focused="focused">
          <span data-slot="prefix" [attr.data-focused]="focused">P</span>
        </ng-template>
        <ng-template cngxSelectInputSuffix let-disabled="disabled">
          <span data-slot="suffix" [attr.data-disabled]="disabled">S</span>
        </ng-template>
      </cngx-typeahead>
    `,
    imports: [CngxTypeahead, CngxSelectInputPrefix, CngxSelectInputSuffix],
  })
  class SlotHost {
    readonly options: CngxSelectOptionsInput<User> = USERS;
  }

  it('*cngxSelectInputPrefix / *cngxSelectInputSuffix project around the input with the reactive slot context', () => {
    TestBed.configureTestingModule({ imports: [SlotHost] });
    const fixture = TestBed.createComponent(SlotHost);
    flush(fixture);
    const prefixContent = fixture.nativeElement.querySelector('[data-slot="prefix"]') as HTMLElement;
    const suffixContent = fixture.nativeElement.querySelector('[data-slot="suffix"]') as HTMLElement;
    expect(prefixContent).not.toBeNull();
    expect(suffixContent).not.toBeNull();
    expect(prefixContent.textContent).toBe('P');
    expect(suffixContent.textContent).toBe('S');
    // Wrapper spans are direct children of the trigger; the projected
    // templates live inside those spans.
    const prefixWrapper = fixture.nativeElement.querySelector('.cngx-typeahead__prefix') as HTMLElement;
    const suffixWrapper = fixture.nativeElement.querySelector('.cngx-typeahead__suffix') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input.cngx-typeahead__input') as HTMLElement;
    const children = Array.from(input.parentElement!.children);
    expect(children.indexOf(prefixWrapper)).toBeLessThan(children.indexOf(input));
    expect(children.indexOf(suffixWrapper)).toBeGreaterThan(children.indexOf(input));
  });
});

describeCommitControllerCascade('CngxTypeahead');
