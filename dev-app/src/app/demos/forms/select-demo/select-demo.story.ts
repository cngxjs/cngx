import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select',
  navLabel: 'Select',
  navCategory: 'field',
  description:
    'CngxSelect — native-feeling single-select dropdown with template overrides, optgroups, clearable, loading, and full mat-select API parity.',
  apiComponents: [
    'CngxSelect',
    'CngxSelectCheck',
    'CngxSelectCaret',
    'CngxSelectOptgroup',
    'CngxSelectEmpty',
    'CngxSelectLoading',
    'CngxSelectTriggerLabel',
    'CngxSelectOptionLabel',
    'provideSelectConfig',
  ],
  overview:
    '<p><code>&lt;cngx-select&gt;</code> composes <code>CngxListboxTrigger</code> + <code>CngxPopover</code> + ' +
    '<code>CngxListbox</code> into a native-feeling dropdown. Single-select only — for multi use <code>CngxMultiSelect</code>.</p>' +
    '<p>Provides <code>CNGX_FORM_FIELD_CONTROL</code> directly, full <code>mat-select</code> parity ' +
    '(<code>open</code>/<code>close</code>/<code>toggle</code>/<code>focus</code>, <code>panelOpen</code>/' +
    '<code>selected</code>/<code>triggerValue</code> signals, <code>selectionChange</code>/<code>openedChange</code>/' +
    '<code>opened</code>/<code>closed</code> outputs, <code>[panelWidth]</code>, <code>[panelClass]</code>, ' +
    '<code>[tabIndex]</code>, <code>[aria-label]</code>, <code>[compareWith]</code>, <code>[required]</code>).</p>' +
    '<p>Template overrides per-instance: <code>*cngxSelectCheck</code>, <code>*cngxSelectCaret</code>, ' +
    '<code>*cngxSelectOptgroup</code>, <code>*cngxSelectPlaceholder</code>, <code>*cngxSelectEmpty</code>, ' +
    '<code>*cngxSelectLoading</code>, <code>*cngxSelectTriggerLabel</code>, <code>*cngxSelectOptionLabel</code>. ' +
    'Globally via <code>provideSelectConfig(withSelectionIndicator(false), withPanelWidth(\'trigger\'), ...)</code>.</p>' +
    '<p>Live-region announcements on every selection change (configurable).</p>',
  moduleImports: [
    "import { form, schema, required, submit } from '@angular/forms/signals';",
    "import { FormControl, Validators } from '@angular/forms';",
    "import { DestroyRef } from '@angular/core';",
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxSelect, CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider, CngxSelectOptionLabel, CngxSelectEmpty, CngxSelectError, CngxSelectCheck, CngxSelectCaret, CngxSelectTriggerLabel, type CngxSelectCommitAction, type CngxSelectOptionDef, type CngxSelectOptionsInput } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
    "import { CngxListbox, CngxListboxTrigger } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import { createManualState, type ManualAsyncState } from '@cngx/common/data';",
  ],
  setup: `
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Rot' },
    { value: 'green', label: 'Grün' },
    { value: 'blue', label: 'Blau' },
    { value: 'disabled', label: 'Nicht verfügbar', disabled: true },
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

  // Standalone single
  protected readonly standaloneValue = signal<string | undefined>(undefined);
  protected readonly declarativeValue = signal<string | undefined>(undefined);
  protected readonly assembledValue = signal<string | undefined>(undefined);
  protected readonly groupedValue = signal<string | undefined>(undefined);
  protected readonly clearableValue = signal<string | undefined>('red');
  protected readonly richValue = signal<string | undefined>(undefined);
  protected readonly loadingValue = signal<string | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly openedLog = signal<string>('—');

  // Async state consumer
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

  // Variant switchers
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

  // Many-option list for PageUp/Down demo
  protected readonly manyOptions: CngxSelectOptionDef<number>[] = Array.from(
    { length: 40 },
    (_, i) => ({ value: i + 1, label: 'Item ' + (i + 1) + ' (#' + (i + 1).toString().padStart(2, '0') + ')' })
  );
  protected readonly manyValue = signal<number | undefined>(undefined);

  // Fixed-width panel
  protected readonly fixedWidthValue = signal<string | undefined>(undefined);

  // Autofocus
  protected readonly autofocusValue = signal<string | undefined>(undefined);
  protected readonly autofocusVisible = signal(false);
  protected toggleAutofocus(): void { this.autofocusVisible.update(v => !v); }

  // Commit action
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

  // Signal Forms
  private readonly singleModel = signal<{ color: string }>({ color: '' });
  private readonly singleSchema = schema<{ color: string }>((root) => {
    required(root.color);
  });
  protected readonly singleForm = form(this.singleModel, this.singleSchema);

  // Reactive Forms
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
    [label]="'Lieblingsfarbe'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Farbe wählen…"
    (openedChange)="handleOpened($event)"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Last panel event</span><span class="event-value">{{ openedLog() }}</span></div>
  </div>`,
    },
    {
      title: '⚠ BLOCKER — declarative composition inside <cngx-select>',
      subtitle:
        '<strong>Does not work yet.</strong> Projected <code>&lt;cngx-option&gt;</code> / ' +
        '<code>&lt;cngx-optgroup&gt;</code> children are invisible to the inner listbox\'s ' +
        '<code>CngxActiveDescendant</code> because Angular content-projection scoping puts ' +
        'them in <code>cngx-select</code>\'s injector tree, not the listbox\'s. Panel opens ' +
        'empty / clicks don\'t register. Tracked for the Combobox architectural pass.',
      imports: ['CngxSelect', 'CngxSelectOption', 'CngxSelectOptgroup', 'CngxSelectDivider'],
      template: `
  <cngx-select
    [label]="'Declarative (broken)'"
    [(value)]="declarativeValue"
    placeholder="Open me — panel will be empty…"
  >
    <cngx-optgroup label="Warm">
      <cngx-option [value]="'red'">Rot</cngx-option>
      <cngx-option [value]="'orange'">Orange</cngx-option>
    </cngx-optgroup>
    <cngx-select-divider />
    <cngx-optgroup label="Cold">
      <cngx-option [value]="'blue'">Blau</cngx-option>
      <cngx-option [value]="'teal'">Türkis</cngx-option>
    </cngx-optgroup>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ declarativeValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Status</span><span class="event-value" style="color:#c62828">AD doesn't see projected options — no selection flow.</span></div>
  </div>`,
    },
    {
      title: 'Assemble it yourself — atoms + element components',
      subtitle:
        'Element components <code>&lt;cngx-option&gt;</code>, <code>&lt;cngx-optgroup&gt;</code>, ' +
        '<code>&lt;cngx-select-divider&gt;</code> <strong>do work</strong> when you compose the ' +
        'listbox yourself using the Level-2 atoms (<code>CngxPopover</code> + ' +
        '<code>CngxListboxTrigger</code> + <code>CngxListbox</code>). The options sit inside the ' +
        'listbox\'s own content-children scope, so AD registration succeeds.',
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
    {{ assembledValue() ?? 'Farbe wählen…' }} ▾
  </button>
  <div cngxPopover #myPop="cngxPopover" placement="bottom" style="padding:0.25rem">
    <div cngxListbox
         #myLb="cngxListbox"
         [label]="'Farbe'"
         [(value)]="assembledValue"
         style="display:flex;flex-direction:column;min-inline-size:10rem">
      <cngx-optgroup label="Warm">
        <cngx-option [value]="'red'">Rot</cngx-option>
        <cngx-option [value]="'orange'">Orange</cngx-option>
      </cngx-optgroup>
      <cngx-select-divider />
      <cngx-optgroup label="Cold">
        <cngx-option [value]="'blue'">Blau</cngx-option>
        <cngx-option [value]="'teal'">Türkis</cngx-option>
      </cngx-optgroup>
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ assembledValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Status</span><span class="event-value" style="color:#2e7d32">Works — consumer owns the listbox, AD sees projected options.</span></div>
  </div>`,
    },
    {
      title: 'Optgroups',
      subtitle: 'Grouped options: pass an array mixing <code>CngxSelectOption</code> and <code>CngxSelectOptionGroup</code>.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Priorität'"
    [options]="priorities"
    [(value)]="groupedValue"
    placeholder="Priorität wählen…"
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
    [label]="'Farbe'"
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
      subtitle: 'Project a <code>*cngxSelectOptionLabel</code> template to render icons/badges per option.',
      imports: ['CngxSelect', 'CngxSelectOptionLabel'],
      template: `
  <cngx-select
    [label]="'Gewerk'"
    [options]="richOptions"
    [(value)]="richValue"
    placeholder="Gewerk wählen…"
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
      subtitle: 'Override panel content via <code>*cngxSelectLoading</code> / <code>*cngxSelectEmpty</code>.',
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
      <span style="opacity:.7">Keine Einträge vorhanden — bitte Filter anpassen.</span>
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
        '<code>[state]</code> drives the panel via <code>CngxAsyncState</code>: ' +
        'loading → skeleton, success → options, empty → empty template, ' +
        'refreshing → top-bar + options, error → retry panel. Replaces ' +
        '<code>[options]</code> while the state has data.',
      imports: ['CngxSelect', 'CngxSelectError'],
      template: `
  <cngx-select
    [label]="'Sprache'"
    [state]="asyncState"
    [retryFn]="asyncReload"
    [(value)]="asyncValue"
    placeholder="Sprache wählen…"
  >
    <ng-template cngxSelectError let-error let-retry="retry">
      <div style="padding:0.5rem 0.75rem;color:#b71c1c">
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
        '<code>[commitAction]</code> defers selection until the async write resolves. ' +
        '<code>[commitMode]="optimistic"</code> closes the panel immediately and rolls back on error; ' +
        '<code>[commitMode]="pessimistic"</code> keeps the panel open with a pending spinner ' +
        'on the picked option and shows an inline banner on error.',
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
        '<code>[loadingVariant]</code> picks one of four built-in first-load visuals: ' +
        '<code>spinner</code> (default), <code>skeleton</code> (with configurable ' +
        '<code>[skeletonRowCount]</code>), <code>bar</code>, or <code>text</code>. ' +
        'Globally configurable via <code>provideSelectConfig(withLoadingVariant(\'skeleton\'), withSkeletonRowCount(5))</code>.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Sprache'"
    [state]="variantState"
    [loadingVariant]="loadingVariantSel()"
    [skeletonRowCount]="5"
    [(value)]="variantValue"
    placeholder="Sprache wählen…"
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
        '<code>[refreshingVariant]</code> controls the subsequent-load indicator when options stay visible: ' +
        '<code>bar</code> (default), <code>spinner</code>, <code>dots</code>, or <code>none</code>. ' +
        'Triggered by <code>state.status() === \'refreshing\'</code>.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Sprache'"
    [state]="variantState"
    [refreshingVariant]="refreshingVariantSel()"
    [(value)]="variantValue"
    placeholder="Sprache wählen…"
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
        'Project a <code>*cngxSelectCaret</code> template — the default ▾ glyph gets replaced ' +
        'with any markup you want, with <code>let-open="open"</code> available for rotation state.',
      imports: ['CngxSelect', 'CngxSelectCaret'],
      template: `
  <cngx-select
    [label]="'Farbe'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Farbe wählen…"
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
        'Project <code>*cngxSelectCheck</code> to replace the ✓ glyph shown on the selected row. ' +
        'Context: <code>let-option</code>, <code>let-selected="selected"</code>.',
      imports: ['CngxSelect', 'CngxSelectCheck'],
      template: `
  <cngx-select
    [label]="'Farbe'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Farbe wählen…"
  >
    <ng-template cngxSelectCheck let-option let-selected="selected">
      @if (selected) {
        <span style="color:#2e7d32" aria-hidden="true">●</span>
      }
    </ng-template>
  </cngx-select>`,
    },
    {
      title: 'Template override: rich trigger label',
      subtitle:
        '<code>*cngxSelectTriggerLabel</code> replaces the trigger\'s text node with your ' +
        'own markup — ideal for icons + label combos that mirror the option rendering.',
      imports: ['CngxSelect', 'CngxSelectTriggerLabel'],
      template: `
  <cngx-select
    [label]="'Gewerk'"
    [options]="richOptions"
    [(value)]="richValue"
    placeholder="Gewerk wählen…"
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
        '<code>[panelWidth]="400"</code> locks the panel\'s min-inline-size to 400px, independent ' +
        'of the trigger width. <code>\'trigger\'</code> (default) matches trigger width via CSS ' +
        '<code>anchor-size()</code>; <code>null</code> lets the panel size to content.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Farbe'"
    [options]="colors"
    [(value)]="fixedWidthValue"
    placeholder="Farbe wählen…"
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
        'Open the panel and press <kbd>PageDown</kbd> / <kbd>PageUp</kbd> to jump 10 rows at a ' +
        'time (clamped at boundaries, skipping disabled rows). Typeahead-while-closed still ' +
        'works — focus the trigger and press a letter to commit without opening.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Item'"
    [options]="manyOptions"
    [(value)]="manyValue"
    placeholder="Item wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ manyValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Options</span><span class="event-value">40 entries — PageUp/Down jumps 10</span></div>
  </div>`,
    },
    {
      title: 'Autofocus on mount',
      subtitle:
        '<code>[autofocus]="true"</code> focuses the trigger on first render — evaluated once, ' +
        'later bound changes have no effect (matches native <code>&lt;select autofocus&gt;</code>).',
      imports: ['CngxSelect'],
      template: `
  <button type="button" class="chip" (click)="toggleAutofocus()" style="margin-bottom:8px">
    {{ autofocusVisible() ? 'Hide select' : 'Mount select (autofocus)' }}
  </button>
  @if (autofocusVisible()) {
    <cngx-select
      [label]="'Farbe'"
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
      subtitle: 'Drop <code>&lt;cngx-select&gt;</code> into <code>&lt;cngx-form-field&gt;</code>. Everything flows automatically.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
      template: `
  <cngx-form-field [field]="singleForm.color">
    <label cngxLabel>Lieblingsfarbe</label>
    <cngx-select [label]="'Lieblingsfarbe'" [options]="colors" placeholder="Farbe wählen…" />
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
      subtitle: '<code>adaptFormControl</code> wraps the <code>FormControl</code> as a <code>Field&lt;T&gt;</code>.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
      template: `
  <cngx-form-field [field]="rfField">
    <label cngxLabel>Farbe (RF)</label>
    <cngx-select [label]="'Farbe (RF)'" [options]="colors" placeholder="Farbe wählen…" />
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">RF control value</span><span class="event-value">{{ rfValue() }}</span></div>
    <div class="event-row"><span class="event-label">RF control dirty</span><span class="event-value">{{ rfControl.dirty ? 'yes' : 'no' }}</span></div>
  </div>`,
    },
  ],
};
