import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Single Select',
  navLabel: 'Select',
  navCategory: 'field',
  description:
    'CngxSelect — native-feeling single-select dropdown with template overrides, optgroups, clearable, loading, commit-action, and signal-/reactive-forms bridges.',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
    'CngxSelectCheck',
    'CngxSelectCaret',
    'CngxSelectOptgroupTemplate',
    'CngxSelectPlaceholder',
    'CngxSelectEmpty',
    'CngxSelectLoading',
    'CngxSelectLoadingGlyph',
    'CngxSelectRefreshing',
    'CngxSelectCommitError',
    'CngxSelectOptionPending',
    'CngxSelectOptionError',
    'CngxSelectRetryButton',
    'CngxSelectTriggerLabel',
    'CngxSelectOptionLabel',
    'CngxSelectClearButton',
    'provideSelectConfig',
  ],
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  moduleImports: [
    "import { form, schema, required, submit } from '@angular/forms/signals';",
    "import { FormControl, Validators } from '@angular/forms';",
    "import { DestroyRef } from '@angular/core';",
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxSelect, CngxSelectOption, CngxSelectOptgroup, CngxSelectOptgroupTemplate, CngxSelectDivider, CngxSelectOptionLabel, CngxSelectEmpty, CngxSelectError, CngxSelectRetryButton, CngxSelectCheck, CngxSelectCaret, CngxSelectTriggerLabel, CngxSelectClearButton, CngxSelectPlaceholder, CngxSelectLoading, CngxSelectLoadingGlyph, CngxSelectRefreshing, CngxSelectCommitError, CngxSelectOptionPending, CngxSelectOptionError, CngxMultiSelect, CngxMultiSelectChip, CngxMultiSelectTriggerLabel, CngxCombobox, CngxComboboxChip, CngxComboboxTriggerLabel, CngxTypeahead, type CngxSelectCommitAction, type CngxSelectOptionDef, type CngxSelectOptionsInput } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
    "import { CngxListbox, CngxListboxTrigger } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import { createManualState, type ManualAsyncState } from '@cngx/common/data';",
  ],
  setup: `
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];

  protected readonly priorities: CngxSelectOptionsInput<string> = [
    { label: 'Normal', children: [
      { value: 'low', label: 'Niedrig' },
      { value: 'medium', label: 'Mittel' },
    ]},
    { label: 'Kritisch', children: [
      { value: 'high', label: 'Hoch' },
      { value: 'urgent', label: 'Dringend' },
    ]},
  ];

  protected readonly richOptions: CngxSelectOptionDef<string>[] = [
    { value: 'fe', label: 'Frontend', meta: { icon: '🖥️' } },
    { value: 'be', label: 'Backend', meta: { icon: '⚙️' } },
    { value: 'db', label: 'Database', meta: { icon: '💾' } },
    { value: 'ops', label: 'DevOps', meta: { icon: '🚀' } },
  ];

  protected readonly loadingOptions: CngxSelectOptionDef<string>[] = [];

  protected readonly standaloneValue = signal<string | undefined>(undefined);

  protected readonly assembledValue = signal<string | undefined>(undefined);

  protected readonly groupedValue = signal<string | undefined>(undefined);

  protected readonly clearableValue = signal<string | undefined>('red');

  protected readonly richValue = signal<string | undefined>(undefined);

  protected readonly loadingValue = signal<string | undefined>(undefined);

  protected readonly loading = signal(true);

  protected readonly openedLog = signal<string>('—');

  protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];

  protected readonly asyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();

  protected readonly asyncValue = signal<string | undefined>(undefined);

  protected asyncReloads = 0;

  protected readonly asyncReload = (): void => {
    this.asyncReloads += 1;
    this.asyncState.set('loading');
    setTimeout(() => this.asyncState.setSuccess(this.asyncOptions), 600);
  };

  protected asyncSetLoading(): void { this.asyncState.set('loading'); }

  protected asyncSetSuccess(): void { this.asyncState.setSuccess(this.asyncOptions); }

  protected asyncSetRefreshing(): void {
    this.asyncState.setSuccess(this.asyncOptions);
    this.asyncState.set('refreshing');
  }

  protected asyncSetError(): void { this.asyncState.setError(new Error('Network offline')); }

  protected asyncSetEmpty(): void { this.asyncState.setSuccess([]); }

  protected readonly loadingVariantSel = signal<'skeleton' | 'spinner' | 'bar' | 'text'>('spinner');

  protected readonly refreshingVariantSel = signal<'bar' | 'spinner' | 'dots' | 'none'>('bar');

  protected readonly variantValue = signal<string | undefined>(undefined);

  protected readonly variantState = createManualState<CngxSelectOptionsInput<string>>();

  protected triggerVariantLoading(): void { this.variantState.set('loading'); }

  protected triggerVariantSuccess(): void { this.variantState.setSuccess(this.asyncOptions); }

  protected triggerVariantRefreshing(): void {
    this.variantState.setSuccess(this.asyncOptions);
    this.variantState.set('refreshing');
  }

  protected readonly manyOptions: CngxSelectOptionDef<number>[] = Array.from(
    { length: 40 },
    (_, i) => ({ value: i + 1, label: 'Item ' + (i + 1) + ' (#' + (i + 1).toString().padStart(2, '0') + ')' })
  );

  protected readonly manyValue = signal<number | undefined>(undefined);

  protected readonly fixedWidthValue = signal<string | undefined>(undefined);

  protected readonly autofocusValue = signal<string | undefined>(undefined);

  protected readonly autofocusVisible = signal(false);

  protected toggleAutofocus(): void { this.autofocusVisible.update(v => !v); }

  protected readonly commitValue = signal<string | undefined>('red');

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

  private readonly singleModel = signal<{ color: string }>({ color: '' });

  private readonly singleSchema = schema<{ color: string }>((root) => {
    required(root.color);
  });

  protected readonly singleForm = form(this.singleModel, this.singleSchema);

  protected readonly rfControl = new FormControl<string>('green', { validators: [Validators.required], nonNullable: true });

  protected readonly rfField = adaptFormControl(this.rfControl, 'color', inject(DestroyRef));

  protected readonly rfValue = toSignal(this.rfControl.valueChanges, { initialValue: this.rfControl.value });

  protected handleSingleSubmit(): void {
    submit(this.singleForm, async () => []);
  }

  protected handleOpened(open: boolean): void {
    this.openedLog.set(open ? 'opened' : 'closed');
  }

  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }
  `,
  sections: [
    {
      title: 'Standalone',
      subtitle: 'Two-way bound via <code>[(value)]</code> — no form-field required.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Favorite color'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Pick a color…"
    (openedChange)="handleOpened($event)"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Last panel event</span><span class="event-value">{{ openedLog() }}</span></div>
  </div>`,
    },
    {
      title: 'Assemble it yourself — atoms + element components',
      subtitle:
        "Composing <code>&lt;cngx-option&gt;</code> / <code>&lt;cngx-optgroup&gt;</code> / <code>&lt;cngx-select-divider&gt;</code> directly inside <code>&lt;cngx-select&gt;</code> <strong>does not work</strong> — content-projection scoping puts the projected children in <code>cngx-select</code>'s injector tree, not the inner listbox's, so <code>CngxActiveDescendant</code> registration fails and the panel opens empty. They <strong>do work</strong> when you compose the listbox yourself using the Level-2 atoms (<code>CngxPopover</code> + <code>CngxListboxTrigger</code> + <code>CngxListbox</code>), because the options sit inside the listbox's own content-children scope.",
      artifact: 'building-block',
      focus: ['composition', 'a11y-pattern'],
      imports: [
        'CngxSelectOption',
        'CngxSelectOptgroup',
        'CngxSelectDivider',
        'CngxListbox',
        'CngxListboxTrigger',
        'CngxPopover',
        'CngxPopoverTrigger',
      ],
      template: `
  <button type="button"
          class="chip"
          [cngxPopoverTrigger]="myPop"
          [haspopup]="'listbox'"
          [cngxListboxTrigger]="myLb"
          [popover]="myPop"
          (click)="myPop.toggle()">
    {{ assembledValue() ?? 'Pick a color…' }} ▾
  </button>
  <div cngxPopover #myPop="cngxPopover" placement="bottom" style="padding:0.25rem">
    <div cngxListbox
         #myLb="cngxListbox"
         [label]="'Color'"
         [(value)]="assembledValue"
         style="display:flex;flex-direction:column;min-inline-size:10rem">
      <cngx-optgroup label="Warm">
        <cngx-option [value]="'red'">Red</cngx-option>
        <cngx-option [value]="'orange'">Orange</cngx-option>
      </cngx-optgroup>
      <cngx-select-divider />
      <cngx-optgroup label="Cold">
        <cngx-option [value]="'blue'">Blue</cngx-option>
        <cngx-option [value]="'teal'">Teal</cngx-option>
      </cngx-optgroup>
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ assembledValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Status</span><span class="event-value" style="color:var(--cngx-color-success)">Works — consumer owns the listbox, AD sees projected options.</span></div>
  </div>`,
    },
    {
      title: 'Optgroups',
      subtitle:
        'Grouped options: pass an array mixing <code>CngxSelectOption</code> and <code>CngxSelectOptionGroup</code>.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Priority'"
    [options]="priorities"
    [(value)]="groupedValue"
    placeholder="Choose priority…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ groupedValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Clearable',
      subtitle: '<code>[clearable]="true"</code> adds a ✕ button when a value is selected.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="clearableValue"
    [clearable]="true"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ clearableValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Rich option rendering',
      subtitle:
        'Project a <code>*cngxSelectOptionLabel</code> template to render icons/badges per option.',
      imports: ['CngxSelect', 'CngxSelectOptionLabel'],
      template: `
  <cngx-select
    [label]="'Trade'"
    [options]="richOptions"
    [(value)]="richValue"
    placeholder="Choose trade…"
  >
    <ng-template cngxSelectOptionLabel let-opt>
      <span>{{ opt.meta?.icon }}</span>
      <strong>{{ opt.label }}</strong>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ richValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Loading + empty templates',
      subtitle:
        'Override panel content via <code>*cngxSelectLoading</code> / <code>*cngxSelectEmpty</code>.',
      imports: ['CngxSelect', 'CngxSelectEmpty'],
      template: `
  <cngx-select
    [label]="'Async'"
    [options]="loadingOptions"
    [(value)]="loadingValue"
    [loading]="loading()"
    placeholder="Nichts geladen…"
  >
    <ng-template cngxSelectEmpty>
      <span style="opacity:.7">No entries — adjust filters.</span>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <button type="button" class="chip" (click)="toggleLoading()">Toggle loading</button>
    </div>
  </div>`,
    },
    {
      title: 'Async state consumer',
      subtitle:
        '<code>[state]</code> drives the panel via <code>CngxAsyncState</code>: loading → skeleton, success → options, empty → empty template, refreshing → top-bar + options, error → retry panel. Replaces <code>[options]</code> while the state has data.',
      imports: ['CngxSelect', 'CngxSelectError'],
      template: `
  <cngx-select
    [label]="'Language'"
    [state]="asyncState"
    [retryFn]="asyncReload"
    [(value)]="asyncValue"
    placeholder="Choose language…"
  >
    <ng-template cngxSelectError let-error let-retry="retry">
      <div style="padding:0.5rem 0.75rem;color:var(--cngx-color-danger)">
        Laden fehlgeschlagen: {{ error?.message ?? error }}
      </div>
      <button type="button" class="chip" style="margin:0 0.75rem 0.5rem" (click)="retry()">Erneut laden</button>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Status</span><span class="event-value">{{ asyncState.status() }}</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ asyncValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Reload calls</span><span class="event-value">{{ asyncReloads }}</span></div>
    <div class="event-row" style="gap:8px">
      <button type="button" class="chip" (click)="asyncSetLoading()">loading</button>
      <button type="button" class="chip" (click)="asyncSetSuccess()">success</button>
      <button type="button" class="chip" (click)="asyncSetRefreshing()">refreshing</button>
      <button type="button" class="chip" (click)="asyncSetError()">error</button>
      <button type="button" class="chip" (click)="asyncSetEmpty()">empty</button>
    </div>
  </div>`,
    },
    {
      title: 'Commit action (async write)',
      subtitle:
        '<code>[commitAction]</code> defers selection until the async write resolves. <code>[commitMode]="optimistic"</code> closes the panel immediately and rolls back on error; <code>[commitMode]="pessimistic"</code> keeps the panel open with a pending spinner on the picked option and shows an inline banner on error.',
      imports: ['CngxSelect', 'CngxSelectError'],
      template: `
  <cngx-select
    [label]="'Farbe (commit)'"
    [options]="colors"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    [(value)]="commitValue"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ commitValue() ?? '—' }}</span></div>
    <div class="event-row" style="gap:8px;align-items:center">
      <label style="display:inline-flex;align-items:center;gap:4px">
        <input type="radio" name="commit-mode" value="optimistic" [checked]="commitMode() === 'optimistic'" (change)="commitMode.set('optimistic')" /> optimistic
      </label>
      <label style="display:inline-flex;align-items:center;gap:4px">
        <input type="radio" name="commit-mode" value="pessimistic" [checked]="commitMode() === 'pessimistic'" (change)="commitMode.set('pessimistic')" /> pessimistic
      </label>
      <label style="display:inline-flex;align-items:center;gap:4px">
        <input type="checkbox" [checked]="commitShouldFail()" (change)="commitShouldFail.set($any($event.target).checked)" /> simulate error
      </label>
    </div>
    <div class="event-row">
      <span class="event-label">Log</span>
      <span class="event-value" style="font-family:monospace;font-size:0.75rem">
        @for (line of commitLog(); track line; let i = $index) {
          <div>{{ line }}</div>
        }
      </span>
    </div>
  </div>`,
    },
    {
      title: 'Loading variants',
      subtitle:
        "<code>[loadingVariant]</code> picks one of four built-in first-load visuals: <code>spinner</code> (default), <code>skeleton</code> (with configurable <code>[skeletonRowCount]</code>), <code>bar</code>, or <code>text</code>. Globally configurable via <code>provideSelectConfig(withLoadingVariant('skeleton'), withSkeletonRowCount(5))</code>.",
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Language'"
    [state]="variantState"
    [loadingVariant]="loadingVariantSel()"
    [skeletonRowCount]="5"
    [(value)]="variantValue"
    placeholder="Choose language…"
  />
  <div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <span class="event-label">Variant</span>
      @for (v of ['spinner','skeleton','bar','text']; track v) {
        <label style="display:inline-flex;align-items:center;gap:4px">
          <input type="radio" name="lv" [value]="v" [checked]="loadingVariantSel() === v" (change)="loadingVariantSel.set($any(v))" /> {{ v }}
        </label>
      }
    </div>
    <div class="event-row" style="gap:8px">
      <button type="button" class="chip" (click)="triggerVariantLoading()">loading</button>
      <button type="button" class="chip" (click)="triggerVariantSuccess()">success</button>
    </div>
  </div>`,
    },
    {
      title: 'Refreshing variants',
      subtitle:
        "<code>[refreshingVariant]</code> controls the subsequent-load indicator when options stay visible: <code>bar</code> (default), <code>spinner</code>, <code>dots</code>, or <code>none</code>. Triggered by <code>state.status() === 'refreshing'</code>.",
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Language'"
    [state]="variantState"
    [refreshingVariant]="refreshingVariantSel()"
    [(value)]="variantValue"
    placeholder="Choose language…"
  />
  <div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <span class="event-label">Variant</span>
      @for (v of ['bar','spinner','dots','none']; track v) {
        <label style="display:inline-flex;align-items:center;gap:4px">
          <input type="radio" name="rv" [value]="v" [checked]="refreshingVariantSel() === v" (change)="refreshingVariantSel.set($any(v))" /> {{ v }}
        </label>
      }
    </div>
    <div class="event-row" style="gap:8px">
      <button type="button" class="chip" (click)="triggerVariantRefreshing()">refreshing</button>
      <button type="button" class="chip" (click)="triggerVariantSuccess()">success</button>
    </div>
  </div>`,
    },
    {
      title: 'Template override: custom caret',
      subtitle:
        'Project a <code>*cngxSelectCaret</code> template — the default ▾ glyph gets replaced with any markup you want, with <code>let-open="open"</code> available for rotation state.',
      imports: ['CngxSelect', 'CngxSelectCaret'],
      template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Pick a color…"
  >
    <ng-template cngxSelectCaret let-open="open">
      <span
        aria-hidden="true"
        [style.display]="'inline-block'"
        [style.transform]="open ? 'rotate(180deg)' : 'rotate(0deg)'"
        [style.transition]="'transform 0.15s ease'"
      >▾</span>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Template override: custom check',
      subtitle:
        'Project <code>*cngxSelectCheck</code> to replace the ✓ glyph shown on the selected row. Context: <code>let-option</code>, <code>let-selected="selected"</code>.',
      imports: ['CngxSelect', 'CngxSelectCheck'],
      template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Pick a color…"
  >
    <ng-template cngxSelectCheck let-option let-selected="selected">
      @if (selected) {
        <span style="color:var(--cngx-color-success)" aria-hidden="true">●</span>
      }
    </ng-template>
  </cngx-select>`,
    },
    {
      title: 'Selection indicator variant: radio',
      subtitle:
        "<code>[selectionIndicatorVariant]=\"'radio'\"</code> swaps the panel's built-in indicator from the checkmark to <code>cngx-radio-indicator</code> (dot-in-circle). Useful for single-select panels that want a radio-style visual without losing dropdown ergonomics. Set globally via <code>provideSelectConfig(withSelectionIndicatorVariant('radio'))</code>.",
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Pick a color…"
    selectionIndicatorVariant="radio"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Variant</span><span class="event-value">radio — dot-in-circle</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Template override: rich trigger label',
      subtitle:
        "<code>*cngxSelectTriggerLabel</code> replaces the trigger's text node with your own markup — ideal for icons + label combos that mirror the option rendering.",
      imports: ['CngxSelect', 'CngxSelectTriggerLabel'],
      template: `
  <cngx-select
    [label]="'Trade'"
    [options]="richOptions"
    [(value)]="richValue"
    placeholder="Choose trade…"
  >
    <ng-template cngxSelectTriggerLabel let-opt>
      <span>{{ opt?.meta?.icon }}</span>
      <strong>{{ opt?.label }}</strong>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ richValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Fixed-width panel (number)',
      subtitle:
        "<code>[panelWidth]=\"400\"</code> locks the panel's min-inline-size to 400px, independent of the trigger width. <code>'trigger'</code> (default) matches trigger width via CSS <code>anchor-size()</code>; <code>null</code> lets the panel size to content.",
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="fixedWidthValue"
    placeholder="Pick a color…"
    [panelWidth]="400"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ fixedWidthValue() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Panel</span><span class="event-value">400px — locked independent of trigger</span></div>
  </div>`,
    },
    {
      title: 'Keyboard: PageUp/PageDown on a long list',
      subtitle:
        'Open the panel and press <kbd>PageDown</kbd> / <kbd>PageUp</kbd> to jump 10 rows at a time (clamped at boundaries, skipping disabled rows). Typeahead-while-closed still works — focus the trigger and press a letter to commit without opening.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Item'"
    [options]="manyOptions"
    [(value)]="manyValue"
    placeholder="Choose item…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ manyValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Options</span><span class="event-value">40 entries — PageUp/Down jumps 10</span></div>
  </div>`,
    },
    {
      title: 'Autofocus on mount',
      subtitle:
        '<code>[autofocus]="true"</code> focuses the trigger on first render — evaluated once, later bound changes have no effect (matches native <code>&lt;select autofocus&gt;</code>).',
      imports: ['CngxSelect'],
      template: `
  <button type="button" class="chip" (click)="toggleAutofocus()" style="margin-bottom:8px">
    {{ autofocusVisible() ? 'Hide select' : 'Mount select (autofocus)' }}
  </button>
  @if (autofocusVisible()) {
    <cngx-select
      [label]="'Color'"
      [options]="colors"
      [(value)]="autofocusValue"
      [autofocus]="true"
      placeholder="Autofocus…"
    />
  }
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ autofocusValue() ?? '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Signal Forms (required)',
      subtitle:
        'Drop <code>&lt;cngx-select&gt;</code> into <code>&lt;cngx-form-field&gt;</code>. Everything flows automatically.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
      template: `
  <cngx-form-field [field]="singleForm.color">
    <label cngxLabel>Lieblingsfarbe</label>
    <cngx-select [label]="'Lieblingsfarbe'" [options]="colors" placeholder="Pick a color…" />
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Field value</span><span class="event-value">{{ singleForm.color().value() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Valid</span><span class="event-value">{{ singleForm.color().valid() ? 'yes' : 'no' }}</span></div>
    <div class="event-row"><span class="event-label">Touched</span><span class="event-value">{{ singleForm.color().touched() ? 'yes' : 'no' }}</span></div>
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="handleSingleSubmit()">Submit</button>
    </div>
  </div>`,
    },
    {
      title: 'Reactive Forms (adaptFormControl)',
      subtitle:
        '<code>adaptFormControl</code> wraps the <code>FormControl</code> as a <code>Field&lt;T&gt;</code>.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
      template: `
  <cngx-form-field [field]="rfField">
    <label cngxLabel>Color (RF)</label>
    <cngx-select [label]="'Color (RF)'" [options]="colors" placeholder="Pick a color…" />
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">RF control value</span><span class="event-value">{{ rfValue() }}</span></div>
    <div class="event-row"><span class="event-label">RF control dirty</span><span class="event-value">{{ rfControl.dirty ? 'yes' : 'no' }}</span></div>
  </div>`,
    },
    {
      title: 'Slot override: *cngxSelectPlaceholder',
      subtitle:
        'Replace the plain placeholder string with custom markup — render an icon + the placeholder text, a stylised hint, or a help link inside the trigger.',
      imports: ['CngxSelect', 'CngxSelectPlaceholder'],
      template: `
  <cngx-select [label]="'Color'" [options]="colors" [(value)]="standaloneValue" placeholder="Pick a color…">
    <ng-template cngxSelectPlaceholder let-text>
      <span style="display:inline-flex;align-items:center;gap:0.4rem;color:var(--cngx-color-text-muted)">
        <span aria-hidden="true">🎨</span>
        <em>{{ text }}</em>
      </span>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Slot override: *cngxSelectLoading',
      subtitle:
        "Replace the panel-shell's default loading indicator with a consumer-authored body — useful for branded spinners, progress text, or a cancel-and-restart affordance.",
      imports: ['CngxSelect', 'CngxSelectLoading'],
      template: `
  <cngx-select [label]="'Language'" [options]="loadingOptions" [(value)]="loadingValue" [loading]="loading()" placeholder="Choose language…">
    <ng-template cngxSelectLoading let-retry="retry">
      <div role="status" aria-live="polite" style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;padding:1rem">
        <span aria-hidden="true" style="font-size:1.5rem">⏳</span>
        <span>Loading available languages…</span>
      </div>
    </ng-template>
  </cngx-select>
  <button type="button" class="chip" (click)="toggleLoading()" style="margin-top:8px">{{ loading() ? 'Stop loading' : 'Start loading' }}</button>`,
    },
    {
      title: 'Slot override: *cngxSelectOptgroup',
      subtitle:
        'Re-skin grouped-option labels — render badges, icons, or counts in the optgroup header without touching the option rows themselves. Class name <code>CngxSelectOptgroupTemplate</code> distinguishes this directive from the <code>&lt;cngx-optgroup&gt;</code> element component used in declarative composition.',
      imports: ['CngxSelect', 'CngxSelectOptgroupTemplate'],
      template: `
  <cngx-select [label]="'Priority'" [options]="priorities" [(value)]="groupedValue" placeholder="Choose priority…">
    <ng-template cngxSelectOptgroup let-group>
      <span style="display:inline-flex;align-items:center;gap:0.5rem">
        <span aria-hidden="true" style="font-size:0.75rem;padding:2px 6px;border-radius:999px;background:color-mix(in oklch, var(--cngx-color-text) 8%, transparent);color:var(--cngx-color-text-muted)">{{ group.children?.length ?? 0 }}</span>
        <strong>{{ group.label }}</strong>
      </span>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ groupedValue() || '—' }}</span></div>
  </div>`,
    },
    {
      title: 'Slot override: *cngxSelectRefreshing',
      subtitle:
        'Replace the default 2px progress bar overlaid on stale options. Override receives <code>previousCount</code> so consumer templates can render context-aware status like <em>"Refreshing 4 items"</em>.',
      imports: ['CngxSelect', 'CngxSelectRefreshing'],
      template: `
  <cngx-select [label]="'Language'" [options]="asyncOptions" [(value)]="asyncValue" [state]="asyncState" placeholder="Choose language…">
    <ng-template cngxSelectRefreshing let-previousCount="previousCount">
      <div role="status" aria-live="polite" style="padding:0.4rem 0.75rem;font-size:0.8rem;color:var(--cngx-color-info);background:linear-gradient(90deg,color-mix(in oklch, var(--cngx-color-info) 10%, transparent),color-mix(in oklch, var(--cngx-color-info) 25%, transparent),color-mix(in oklch, var(--cngx-color-info) 10%, transparent));background-size:200% 100%;animation:cngx-select-refresh-shimmer 1.6s linear infinite">
        🔄 Refreshing {{ previousCount }} options…
      </div>
    </ng-template>
  </cngx-select>
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
    <button type="button" class="chip" (click)="asyncSetRefreshing()">Trigger refresh</button>
  </div>`,
    },
    {
      title: 'Slot override: *cngxSelectCommitError',
      subtitle:
        "Replace the panel-shell's default commit-error banner with custom markup. Override receives <code>error</code>, the <code>option</code> the user was trying to pick, and a <code>retry()</code> callback that replays the commit.",
      imports: ['CngxSelect', 'CngxSelectCommitError'],
      template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="commitValue"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    commitErrorDisplay="banner"
  >
    <ng-template cngxSelectCommitError let-error let-option="option" let-retry="retry">
      <div role="alert" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:color-mix(in oklch, var(--cngx-color-danger) 10%, transparent);color:var(--cngx-color-danger);border-radius:6px">
        <span aria-hidden="true">⚠</span>
        <span style="flex:1">Could not save <strong>{{ option?.label }}</strong>: {{ error?.message }}</span>
        <button type="button" class="chip" (click)="retry()">Replay</button>
      </div>
    </ng-template>
  </cngx-select>
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="commitShouldFail.set(!commitShouldFail())">
      {{ commitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
  </div>`,
    },
    {
      title: 'Slot overrides: *cngxSelectOptionPending + *cngxSelectOptionError',
      subtitle:
        'Per-option-row indicators driven by <code>[commitAction]</code>. Pending shows while the commit is in flight; the error glyph appears on the row that failed (with <code>commitErrorDisplay="inline"</code>).',
      imports: ['CngxSelect', 'CngxSelectOptionPending', 'CngxSelectOptionError'],
      template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="commitValue"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    commitErrorDisplay="inline"
  >
    <ng-template cngxSelectOptionPending let-opt>
      <span aria-hidden="true" style="margin-inline-start:auto;font-size:0.75rem">⏳</span>
    </ng-template>
    <ng-template cngxSelectOptionError let-opt let-error="error">
      <span aria-hidden="true" [title]="error?.message" style="margin-inline-start:auto;color:var(--cngx-color-danger)">✕</span>
    </ng-template>
  </cngx-select>
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="commitShouldFail.set(!commitShouldFail())">
      {{ commitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
    <button type="button" class="chip" (click)="commitMode.set(commitMode() === 'optimistic' ? 'pessimistic' : 'optimistic')">
      Mode: {{ commitMode() }}
    </button>
  </div>`,
    },
    {
      title: 'Slot override: *cngxSelectRetryButton',
      subtitle:
        'Swap the visual frame of every Retry / Try again button rendered by the shared panel-shell — load-error, inline refresh-error, and commit-error banner all read from this single override. Context: <code>{ retry, error, disabled, label }</code>.',
      imports: ['CngxSelect', 'CngxSelectRetryButton'],
      template: `
  <cngx-select [label]="'Language'" [options]="asyncOptions" [(value)]="asyncValue" [state]="asyncState" placeholder="Choose language…">
    <ng-template cngxSelectRetryButton let-retry let-label="label" let-disabled="disabled">
      <button type="button" class="chip" [disabled]="disabled" (click)="retry()" style="background:color-mix(in oklch, var(--cngx-color-warning) 10%, transparent);border-color:color-mix(in oklch, var(--cngx-color-warning) 35%, transparent);color:var(--cngx-color-warning)">
        ↻ {{ label }}
      </button>
    </ng-template>
  </cngx-select>
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetError()">Trigger load error</button>
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
  </div>`,
    },
    {
      title: 'Slot override: *cngxSelectLoadingGlyph',
      subtitle:
        'Replace the inner CSS-driven glyph of the spinner / bar / dots loading variants while keeping the shell\'s ARIA wiring (<code>role="status"</code>, <code>aria-live</code>, <code>aria-label</code>). Skeleton variant ignores this slot — its rows are layout, not glyph.',
      imports: ['CngxSelect', 'CngxSelectLoadingGlyph'],
      template: `
  <cngx-select
    [label]="'Language'"
    [options]="asyncOptions"
    [(value)]="asyncValue"
    [state]="asyncState"
    loadingVariant="spinner"
    placeholder="Choose language…"
  >
    <ng-template cngxSelectLoadingGlyph>
      <span aria-hidden="true" style="font-size:1.25rem;display:inline-block;animation:cngx-select-spin 1s linear infinite">⚙</span>
    </ng-template>
  </cngx-select>
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetLoading()">Set loading</button>
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
  </div>`,
    },
    {
      title: 'commitErrorDisplay variants — banner / inline / none',
      subtitle:
        'Three identical selects bound to the same fail-on-demand <code>commitAction</code> with the three <code>commitErrorDisplay</code> values side by side. Toggle <em>Fail next</em>, click a value, and watch how each display mode surfaces the rejection.',
      imports: ['CngxSelect'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem">
    <div>
      <h4 style="margin:0 0 0.5rem 0;font-size:0.85rem">banner</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="banner"
      />
      <small style="display:block;margin-top:6px;color:var(--cngx-color-text-muted)">Default. Inline alert above the option list.</small>
    </div>
    <div>
      <h4 style="margin:0 0 0.5rem 0;font-size:0.85rem">inline</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="inline"
      />
      <small style="display:block;margin-top:6px;color:var(--cngx-color-text-muted)">Per-row visual badge on the failing option (AT feedback via the announcer).</small>
    </div>
    <div>
      <h4 style="margin:0 0 0.5rem 0;font-size:0.85rem">none</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="none"
      />
      <small style="display:block;margin-top:6px;color:var(--cngx-color-text-muted)">No built-in UI — bridge via <code>&lt;cngx-toast-on /&gt;</code> or other transition bridges.</small>
    </div>
  </div>
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="commitShouldFail.set(!commitShouldFail())">
      {{ commitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
  </div>`,
    },
  ],
};
