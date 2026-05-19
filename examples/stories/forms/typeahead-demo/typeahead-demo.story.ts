import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Typeahead',
  navLabel: 'Typeahead',
  navCategory: 'field',
  description: 'CngxTypeahead — scalar async autocomplete. Single-value input bound to an async option source with typed-form-field, commit-action and slot-override support.',
  apiComponents: [
    'CngxTypeahead',
    'CngxSelectOptionLabel',
  ],
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  moduleImports: [
    'import { form, schema, required, submit } from \'@angular/forms/signals\';',
    'import { FormControl, Validators } from \'@angular/forms\';',
    'import { DestroyRef } from \'@angular/core\';',
    'import { toSignal } from \'@angular/core/rxjs-interop\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl } from \'@cngx/forms/field\';',
    'import { CngxSelect, CngxSelectOption, CngxSelectOptgroup, CngxSelectOptgroupTemplate, CngxSelectDivider, CngxSelectOptionLabel, CngxSelectEmpty, CngxSelectError, CngxSelectRetryButton, CngxSelectCheck, CngxSelectCaret, CngxSelectTriggerLabel, CngxSelectClearButton, CngxSelectPlaceholder, CngxSelectLoading, CngxSelectLoadingGlyph, CngxSelectRefreshing, CngxSelectCommitError, CngxSelectOptionPending, CngxSelectOptionError, CngxMultiSelect, CngxMultiSelectChip, CngxMultiSelectTriggerLabel, CngxCombobox, CngxComboboxChip, CngxComboboxTriggerLabel, CngxTypeahead, type CngxSelectCommitAction, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
    'import { CngxListbox, CngxListboxTrigger } from \'@cngx/common/interactive\';',
    'import { CngxPopover, CngxPopoverTrigger } from \'@cngx/common/popover\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  setup: `
  protected readonly loading = signal(true);

  protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');

  protected readonly commitShouldFail = signal(false);

  protected readonly commitLog = signal<string[]>([]);

  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.commitLog.update(l => [...l, ts + ' → commit(' + String(intended) + ')']);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };

  protected readonly typeaheadUsers: CngxSelectOptionDef<{ id: number; name: string }>[] = [
    { value: { id: 1, name: 'Alice Meier' },  label: 'Alice Meier' },
    { value: { id: 2, name: 'Bob Schmidt' },  label: 'Bob Schmidt' },
    { value: { id: 3, name: 'Charlotte Fischer' }, label: 'Charlotte Fischer' },
    { value: { id: 4, name: 'David Weber' }, label: 'David Weber' },
    { value: { id: 5, name: 'Eva Wagner' }, label: 'Eva Wagner' },
  ];

  protected readonly typeaheadValue = signal<{ id: number; name: string } | undefined>(undefined);

  protected readonly typeaheadCompare = (a: { id: number } | undefined, b: { id: number } | undefined): boolean =>
    (a?.id ?? NaN) === (b?.id ?? NaN);

  protected readonly typeaheadDisplay = (u: { id: number; name: string }): string => u.name;

  protected readonly typeaheadSearchLog = signal<string[]>([]);

  protected handleTypeaheadSearch(term: string): void {
    this.typeaheadSearchLog.update(l => [...l.slice(-4), term]);
  }

  protected readonly typeaheadColorOptions: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Rot' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blau' },
    { value: 'yellow', label: 'Gelb' },
    { value: 'orange', label: 'Orange' },
  ];

  protected readonly typeaheadColorModel = signal<string>('');

  protected readonly typeaheadColorField = form(this.typeaheadColorModel, schema<string>((c) => { required(c); }));

  protected readonly typeaheadAsyncState: ManualAsyncState<CngxSelectOptionsInput<{ id: number; name: string }>> =
    createManualState<CngxSelectOptionsInput<{ id: number; name: string }>>();

  protected readonly typeaheadAsyncValue = signal<{ id: number; name: string } | undefined>(undefined);

  protected typeaheadAsyncSetLoading(): void { this.typeaheadAsyncState.set('loading'); }

  protected typeaheadAsyncSetSuccess(): void { this.typeaheadAsyncState.setSuccess(this.typeaheadUsers); }

  protected typeaheadAsyncSetError(): void { this.typeaheadAsyncState.setError(new Error('Network offline')); }

  protected readonly typeaheadCommitValue = signal<{ id: number; name: string } | undefined>(undefined);

  protected readonly typeaheadCommitMode = signal<'optimistic' | 'pessimistic'>('optimistic');

  protected readonly typeaheadCommitShouldFail = signal(false);

  protected readonly typeaheadCommitLog = signal<string[]>([]);

  protected readonly typeaheadCommitAction: CngxSelectCommitAction<{ id: number; name: string }> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.typeaheadCommitLog.update(l => [...l, ts + ' → commit(' + (intended?.name ?? 'undefined') + ')']);
    if (this.typeaheadCommitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };
  `,
  sections: [
    {
      title: 'Typeahead — single-value async autocomplete',
      subtitle: 'Inline <code>&lt;input role="combobox"&gt;</code> with <code>displayWith</code> — type to filter, pick to commit a single value. The input shows <code>displayWith(value)</code> after a pick so the selection survives blur/refocus. <code>clearOnBlur</code> (default <code>true</code>) snaps the input back to the last-committed display if the user types stray text without picking.',
      imports: ['CngxTypeahead'],
      template: `
  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [clearable]="true"
    placeholder="Search by name…"
    [(value)]="typeaheadValue"
    (searchTermChange)="handleTypeaheadSearch($event)"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ typeaheadValue()?.name || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Search log</span><span class="event-value">{{ typeaheadSearchLog().join(' → ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Typeahead — bound to a typed form field',
      subtitle: 'Wrapped in <code>&lt;cngx-form-field&gt;</code>. The typeahead binds to the <code>Field&lt;T&gt;</code> via <code>createFieldSync</code> — bidirectional sync with the form value, ARIA wiring inherited from the field-presenter.',
      imports: ['CngxTypeahead', 'CngxFormField'],
      template: `
  <cngx-form-field [field]="typeaheadColorField">
    <cngx-typeahead
      [label]="'Color'"
      [options]="typeaheadColorOptions"
      [clearable]="true"
      placeholder="Farbe eingeben…"
    />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Field value</span><span class="event-value">{{ typeaheadColorField().value() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Typeahead — async [state] (load + error + retry)',
      subtitle: 'Typeahead with <code>[state]</code> driving the panel view. Trigger <em>Load</em> / <em>Error</em> / <em>Reset</em> to step through the async-view machine — first-load skeleton, error banner with retry, refresh shimmer.',
      imports: ['CngxTypeahead'],
      template: `
  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [state]="typeaheadAsyncState"
    [clearable]="true"
    placeholder="Search by name…"
    [(value)]="typeaheadAsyncValue"
  />
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="typeaheadAsyncSetLoading()">Set loading</button>
    <button type="button" class="chip" (click)="typeaheadAsyncSetSuccess()">Set success</button>
    <button type="button" class="chip" (click)="typeaheadAsyncSetError()">Set error</button>
  </div>`,
    },
    {
      title: 'Typeahead — [commitAction] with optimistic/pessimistic mode',
      subtitle: 'Same commit machinery as CngxSelect. Pick a user — the action runs for 800ms. Toggle mode to compare panel-close timing (optimistic closes immediately + rolls back on error; pessimistic keeps panel open until success). Fail-next button forces the action into the error path.',
      imports: ['CngxTypeahead'],
      template: `
  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [commitAction]="typeaheadCommitAction"
    [commitMode]="typeaheadCommitMode()"
    [(value)]="typeaheadCommitValue"
    placeholder="Search by name…"
  />
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="typeaheadCommitMode.set(typeaheadCommitMode() === 'optimistic' ? 'pessimistic' : 'optimistic')">
      Mode: {{ typeaheadCommitMode() }}
    </button>
    <button type="button" class="chip" (click)="typeaheadCommitShouldFail.set(!typeaheadCommitShouldFail())">
      {{ typeaheadCommitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ typeaheadCommitValue()?.name ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Log</span><span class="event-value">{{ typeaheadCommitLog().slice(-3).join(' · ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Typeahead — *cngxSelectOptionLabel slot override',
      subtitle: 'Same slot family as CngxSelect — project a custom <code>*cngxSelectOptionLabel</code> template to render avatars / badges / two-line layouts in the typeahead listbox.',
      imports: ['CngxTypeahead', 'CngxSelectOptionLabel'],
      template: `
  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [(value)]="typeaheadValue"
    placeholder="Search by name…"
  >
    <ng-template cngxSelectOptionLabel let-opt>
      <span style="display:flex;align-items:center;gap:0.5rem">
        <span aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;width:1.5rem;height:1.5rem;border-radius:50%;background:color-mix(in oklch, var(--cngx-color-info) 18%, transparent);color:var(--cngx-color-info);font-size:0.7rem">
          {{ opt.label.charAt(0) }}
        </span>
        <span>
          <strong>{{ opt.label }}</strong>
          <small style="display:block;color:var(--cngx-color-text-muted)">id: {{ opt.value.id }}</small>
        </span>
      </span>
    </ng-template>
  </cngx-typeahead>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ typeaheadValue()?.name ?? '—' }}</span></div>
  </div>`,
    },
  ],
};
