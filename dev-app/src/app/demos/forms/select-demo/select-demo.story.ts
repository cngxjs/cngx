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
    "import { CngxSelect, CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider, CngxSelectOptionLabel, CngxSelectEmpty, type CngxSelectOptionDef, type CngxSelectOptionsInput } from '@cngx/forms/select';",
    "import { CngxListbox, CngxListboxTrigger } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
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
