import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Combobox',
  navLabel: 'Combobox',
  navCategory: 'field',
  description: 'CngxCombobox — tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect.',
  apiComponents: [
    'CngxCombobox',
    'CngxComboboxChip',
    'CngxComboboxTriggerLabel',
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

  protected readonly comboValues = signal<string[]>(['angular']);

  protected readonly comboTextValues = signal<string[]>(['angular', 'signals']);

  protected readonly comboClearableValues = signal<string[]>(['angular', 'a11y']);

  protected readonly comboLastTerm = signal<string>('');

  protected readonly comboAsyncValues = signal<string[]>([]);

  protected readonly comboAsyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();

  protected comboAsyncSetLoading(): void { this.comboAsyncState.set('loading'); }

  protected comboAsyncSetSuccess(): void {
    this.comboAsyncState.setSuccess(this.tagOptions);
  }

  protected readonly comboCommitValues = signal<string[]>(['angular']);

  protected readonly comboCommitMode = signal<'optimistic' | 'pessimistic'>('optimistic');

  protected readonly comboCommitShouldFail = signal(false);

  protected readonly comboCommitLog = signal<string[]>([]);

  protected readonly comboCommitAction: CngxSelectCommitAction<string[]> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.comboCommitLog.update(l => [...l, ts + ' → commit([' + (intended ?? []).join(',') + '])']);
    if (this.comboCommitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };
  `,
  sections: [
    {
      title: 'Combobox — basic (tag picker with typeahead filter)',
      subtitle: '<code>&lt;cngx-combobox&gt;</code> — inline <code>&lt;input role="combobox"&gt;</code> next to the chip strip. Typing filters the panel live; Backspace on an empty input removes the trailing chip; panel stays open on each pick (<code>closeOnSelect</code> default <code>false</code>).',
      imports: ['CngxCombobox'],
      template: `
  <cngx-combobox
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="comboValues"
    placeholder="Search topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ comboValues().length }}</span></div>
  </div>`,
    },
    {
      title: 'Combobox — async via [state] + [skipInitial] + (searchTermChange)',
      subtitle: 'Async-option wiring for server-driven autocomplete. <code>[skipInitial]="true"</code> suppresses the hydrate-time empty-string emission so your request handler never fires a "load everything" on mount. <code>(searchTermChange)</code> bridges the debounced term to your backend; <code>[state]</code> feeds the returned options back into the panel with the full async-view protocol (loading/empty/error/refreshing).',
      imports: ['CngxCombobox'],
      template: `
  <cngx-combobox
    [label]="'Topics'"
    [state]="comboAsyncState"
    [(values)]="comboAsyncValues"
    [skipInitial]="true"
    (searchTermChange)="comboLastTerm.set($event)"
    placeholder="Search topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="comboAsyncSetLoading()">Set loading</button>
      <button type="button" class="chip" (click)="comboAsyncSetSuccess()">Set success</button>
    </div>
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboAsyncValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">State status</span><span class="event-value">{{ comboAsyncState.status() }}</span></div>
    <div class="event-row"><span class="event-label">Last term</span><span class="event-value">{{ comboLastTerm() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Combobox — per-toggle [commitAction]',
      subtitle: 'Every toggle (option click, chip ×, Backspace-on-empty, clear-all) routes through an async write with optimistic/pessimistic supersede semantics — same wiring as the multi-select producer.',
      imports: ['CngxCombobox'],
      template: `
  <div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px">
    <button type="button" class="chip"
            [style.background]="comboCommitMode() === 'optimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="comboCommitMode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="comboCommitMode() === 'pessimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="comboCommitMode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="comboCommitShouldFail()"
             (change)="comboCommitShouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
  </div>
  <cngx-combobox
    [label]="'Topics (commit)'"
    [options]="tagOptions"
    [(values)]="comboCommitValues"
    [commitAction]="comboCommitAction"
    [commitMode]="comboCommitMode()"
    placeholder="Search topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboCommitValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Commit log</span>
      <span class="event-value" style="white-space:pre">{{ comboCommitLog().slice(-4).join('\\n') || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Combobox — clearable + custom *cngxSelectClearButton',
      subtitle: 'Reuse the shared <code>*cngxSelectClearButton</code> slot to swap the default ✕ for any consumer-authored trigger. Same slot works on <code>CngxSelect</code> and <code>CngxMultiSelect</code>.',
      imports: ['CngxCombobox', 'CngxSelectClearButton'],
      template: `
  <cngx-combobox
    [label]="'Topics'"
    [options]="tagOptions"
    [clearable]="true"
    [(values)]="comboClearableValues"
    placeholder="Search topics…"
  >
    <ng-template cngxSelectClearButton let-clear let-disabled="disabled">
      <button type="button" class="chip" [disabled]="disabled" (click)="clear()">
        Reset all
      </button>
    </ng-template>
  </cngx-combobox>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboClearableValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Combobox — text summary via *cngxComboboxTriggerLabel',
      subtitle: 'Replace the chip strip with a plain-text summary while keeping the filter input visible. Context exposes the resolved options, raw values, and count — ideal for compact variants ("3 topics selected" + input on the same row).',
      imports: ['CngxCombobox', 'CngxComboboxTriggerLabel'],
      template: `
  <cngx-combobox
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="comboTextValues"
    placeholder="Search topics…"
  >
    <ng-template cngxComboboxTriggerLabel let-opts let-count="count">
      @if (count === 0) {
        <!-- Placeholder takes over when empty -->
      } @else if (count === 1) {
        <span style="padding-inline-end:0.5rem">{{ opts[0].label }}</span>
      } @else {
        <span style="padding-inline-end:0.5rem;font-weight:500">{{ count }} topics</span>
      }
    </ng-template>
  </cngx-combobox>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboTextValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ comboTextValues().length }}</span></div>
  </div>`,
    },
    {
      title: 'Slot override: *cngxComboboxChip',
      subtitle: 'Per-chip override for the combobox\'s tag strip — same context shape as <code>*cngxMultiSelectChip</code> (<code>{ option, remove, index }</code>), so a consumer-authored chip template can be projected into either variant unchanged.',
      imports: ['CngxCombobox', 'CngxComboboxChip'],
      template: `
  <cngx-combobox [label]="'Topics'" [options]="tagOptions" [(values)]="comboValues" placeholder="Choose tag…">
    <ng-template cngxComboboxChip let-opt let-remove="remove" let-i="index">
      <span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.15rem 0.5rem;border-radius:999px;background:color-mix(in oklch, var(--cngx-color-info) 15%, transparent);color:var(--cngx-color-info);font-size:0.8rem">
        <span aria-hidden="true">#{{ i + 1 }}</span>
        <strong>{{ opt.label }}</strong>
        <button type="button" (click)="remove()" aria-label="Remove" style="background:none;border:none;color:inherit;cursor:pointer;padding:0 2px">×</button>
      </span>
    </ng-template>
  </cngx-combobox>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboValues().join(', ') || '—' }}</span></div>
  </div>`,
    },
  ],
};
