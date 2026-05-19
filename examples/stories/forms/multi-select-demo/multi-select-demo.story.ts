import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi Select',
  navLabel: 'MultiSelect',
  navCategory: 'field',
  description: 'CngxMultiSelect — multi-value selection with a chip strip trigger. Same async/commit machinery as CngxSelect; multi-specific slot overrides for chip + summary templates.',
  apiComponents: [
    'CngxMultiSelect',
    'CngxMultiSelectChip',
    'CngxMultiSelectTriggerLabel',
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

  protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];

  protected readonly multiValues = signal<string[]>(['angular', 'signals']);

  protected readonly multiClearableValues = signal<string[]>(['angular', 'a11y']);

  protected readonly multiCustomChipValues = signal<string[]>(['angular', 'signals', 'rxjs']);

  protected readonly multiTextValues = signal<string[]>(['angular', 'signals']);

  protected readonly multiAsyncValues = signal<string[]>([]);

  protected readonly multiAsyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();

  protected multiAsyncSetLoading(): void { this.multiAsyncState.set('loading'); }

  protected multiAsyncSetSuccess(): void { this.multiAsyncState.setSuccess(this.tagOptions); }

  protected readonly multiCommitValues = signal<string[]>(['angular']);

  protected readonly multiCommitMode = signal<'optimistic' | 'pessimistic'>('optimistic');

  protected readonly multiCommitShouldFail = signal(false);

  protected readonly multiCommitLog = signal<string[]>([]);

  protected readonly multiCommitAction: CngxSelectCommitAction<string[]> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.multiCommitLog.update(l => [...l, ts + ' → commit([' + (intended ?? []).join(',') + '])']);
    if (this.multiCommitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };
  `,
  sections: [
    {
      title: 'Multi — basic',
      subtitle: '<code>&lt;cngx-multi-select&gt;</code> with <code>[(values)]</code>. Panel stays open on each toggle (native <code>&lt;select multiple&gt;</code> parity). Disabled options don\'t toggle. Typing while the panel is closed toggles the first matching option.',
      imports: ['CngxMultiSelect'],
      template: `
  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiValues"
    placeholder="Choose topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ multiValues().length }}</span></div>
  </div>`,
    },
    {
      title: 'Multi — clearable',
      subtitle: '<code>[clearable]="true"</code> exposes a single ✕ next to the caret that empties the whole selection in one click. The per-chip ✕ on every pill stays independent of this flag.',
      imports: ['CngxMultiSelect'],
      template: `
  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiClearableValues"
    [clearable]="true"
    placeholder="Choose topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiClearableValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Multi — async options via [state]',
      subtitle: 'Same async-state protocol as the single variant. The panel renders skeleton / empty / error / refreshing states from the bound <code>CngxAsyncState</code>; the trigger chip list stays derived from the resolved data.',
      imports: ['CngxMultiSelect'],
      template: `
  <cngx-multi-select
    [label]="'Topics'"
    [state]="multiAsyncState"
    [(values)]="multiAsyncValues"
    placeholder="Choose topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="multiAsyncSetLoading()">Set loading</button>
      <button type="button" class="chip" (click)="multiAsyncSetSuccess()">Set success</button>
    </div>
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiAsyncValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">State status</span><span class="event-value">{{ multiAsyncState.status() }}</span></div>
  </div>`,
    },
    {
      title: 'Multi — per-toggle [commitAction]',
      subtitle: 'Each toggle routes through an async write. <code>optimistic</code> (default) updates <code>values()</code> immediately and rolls back on error; <code>pessimistic</code> defers the write until success and surfaces a spinner on the toggled option. Consecutive toggles supersede any in-flight commit.',
      imports: ['CngxMultiSelect'],
      template: `
  <div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px">
    <button type="button" class="chip"
            [style.background]="multiCommitMode() === 'optimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="multiCommitMode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="multiCommitMode() === 'pessimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="multiCommitMode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="multiCommitShouldFail()"
             (change)="multiCommitShouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
  </div>
  <cngx-multi-select
    [label]="'Topics (commit)'"
    [options]="tagOptions"
    [(values)]="multiCommitValues"
    [commitAction]="multiCommitAction"
    [commitMode]="multiCommitMode()"
    placeholder="Choose topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiCommitValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Commit log</span>
      <span class="event-value" style="white-space:pre">{{ multiCommitLog().slice(-4).join('\\n') || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Multi — text summary via *cngxMultiSelectTriggerLabel',
      subtitle: 'Replace the whole chip strip with a plain-text summary by projecting <code>*cngxMultiSelectTriggerLabel</code>. The template context gives you the resolved options, raw values, and count — pick any shape (count badge, comma list, first-label + "+N", …).',
      imports: ['CngxMultiSelect', 'CngxMultiSelectTriggerLabel'],
      template: `
  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiTextValues"
    placeholder="Choose topics…"
  >
    <ng-template cngxMultiSelectTriggerLabel let-opts let-count="count">
      @if (count === 1) {
        {{ opts[0].label }}
      } @else {
        {{ count }} topics selected
      }
    </ng-template>
  </cngx-multi-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiTextValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ multiTextValues().length }}</span></div>
  </div>`,
    },
    {
      title: 'Multi — custom *cngxMultiSelectChip template',
      subtitle: 'Replace the default <code>&lt;cngx-chip&gt;</code> pill per instance with any content. The template context gives you the full option plus a commit-aware <code>remove</code> callback.',
      imports: ['CngxMultiSelect', 'CngxMultiSelectChip'],
      template: `
  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiCustomChipValues"
    placeholder="Choose topics…"
  >
    <ng-template cngxMultiSelectChip let-opt let-remove="remove">
      <span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.125rem 0.5rem;border-radius:0.25rem;background:color-mix(in oklch, var(--cngx-color-info) 15%, transparent);color:var(--cngx-color-info);font-weight:500;">
        <span>#{{ opt.label }}</span>
        <button type="button" (click)="remove()" style="border:0;background:transparent;color:inherit;cursor:pointer;padding:0 0.125rem;">✕</button>
      </span>
    </ng-template>
  </cngx-multi-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiCustomChipValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
  ],
};
