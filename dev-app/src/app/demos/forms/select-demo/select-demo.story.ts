import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select',
  navLabel: 'Select',
  navCategory: 'field',
  description:
    'CngxSelect — native cngx dropdown composite. Standalone or inside cngx-form-field, with zero bridge boilerplate.',
  apiComponents: ['CngxSelect'],
  overview:
    '<p><code>&lt;cngx-select&gt;</code> composes <code>CngxListboxTrigger</code>, <code>CngxPopover</code>, and ' +
    '<code>CngxListbox</code> into a dropdown. Supports single and multi-select via <code>[(value)]</code> / ' +
    '<code>[(selectedValues)]</code>, plus <code>[compareWith]</code> for custom equality.</p>' +
    '<p>Provides <code>CNGX_FORM_FIELD_CONTROL</code> directly — drop it into <code>&lt;cngx-form-field&gt;</code> ' +
    'and both value-flow and ARIA wiring work out of the box, no bridge directive required.</p>',
  moduleImports: [
    "import { form, schema, required, minLength, submit } from '@angular/forms/signals';",
    "import { FormControl, Validators } from '@angular/forms';",
    "import { DestroyRef } from '@angular/core';",
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxSelect, type CngxSelectOption } from '@cngx/forms/select';",
  ],
  setup: `
  protected readonly colors: CngxSelectOption<string>[] = [
    { value: 'red', label: 'Rot' },
    { value: 'green', label: 'Grün' },
    { value: 'blue', label: 'Blau' },
    { value: 'disabled', label: 'Nicht verfügbar', disabled: true },
  ];

  protected readonly toppings: CngxSelectOption<string>[] = [
    { value: 'cheese', label: 'Käse' },
    { value: 'pepperoni', label: 'Pepperoni' },
    { value: 'mushroom', label: 'Champignons' },
    { value: 'olive', label: 'Oliven' },
    { value: 'onion', label: 'Zwiebel' },
  ];

  // ── Standalone ───────────────────────────────────────────
  protected readonly standaloneValue = signal<string | undefined>(undefined);
  protected readonly standaloneMulti = signal<string[]>([]);

  // ── Signal Forms single ──────────────────────────────────
  private readonly singleModel = signal<{ color: string }>({ color: '' });
  private readonly singleSchema = schema<{ color: string }>((root) => {
    required(root.color);
  });
  protected readonly singleForm = form(this.singleModel, this.singleSchema);

  // ── Signal Forms multi ───────────────────────────────────
  private readonly multiModel = signal<{ toppings: string[] }>({ toppings: [] });
  private readonly multiSchema = schema<{ toppings: string[] }>((root) => {
    minLength(root.toppings, 2);
  });
  protected readonly multiForm = form(this.multiModel, this.multiSchema);

  // ── Reactive Forms ───────────────────────────────────────
  protected readonly rfControl = new FormControl<string>('green', { validators: [Validators.required], nonNullable: true });
  protected readonly rfField = adaptFormControl(this.rfControl, 'color', inject(DestroyRef));
  protected readonly rfValue = toSignal(this.rfControl.valueChanges, { initialValue: this.rfControl.value });

  protected handleSingleSubmit(): void {
    submit(this.singleForm, async () => []);
  }
  protected handleMultiSubmit(): void {
    submit(this.multiForm, async () => []);
  }
  `,
  sections: [
    {
      title: 'Standalone — single-select',
      subtitle:
        'No form-field. Two-way bound via <code>[(value)]</code> directly.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Lieblingsfarbe'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Farbe wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Value</span>
      <span class="event-value">{{ standaloneValue() || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Standalone — multi-select',
      subtitle:
        'Multi-mode keeps the popover open between clicks and joins labels on the trigger.',
      imports: ['CngxSelect'],
      template: `
  <cngx-select
    [label]="'Beläge'"
    [options]="toppings"
    [multiple]="true"
    [(selectedValues)]="standaloneMulti"
    placeholder="Beläge wählen…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">{{ standaloneMulti().join(', ') || '—' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Signal Forms — single select (required)',
      subtitle:
        'Just drop <code>&lt;cngx-select&gt;</code> inside <code>&lt;cngx-form-field&gt;</code>. ID, ARIA, and errors flow automatically.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
      template: `
  <cngx-form-field [field]="singleForm.color">
    <label cngxLabel>Lieblingsfarbe</label>
    <cngx-select [label]="'Lieblingsfarbe'" [options]="colors" placeholder="Farbe wählen…" />
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Field value</span>
      <span class="event-value">{{ singleForm.color().value() || '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Valid</span>
      <span class="event-value">{{ singleForm.color().valid() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Touched</span>
      <span class="event-value">{{ singleForm.color().touched() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="handleSingleSubmit()">Submit</button>
    </div>
  </div>`,
    },
    {
      title: 'Signal Forms — multi select (min 2)',
      subtitle:
        'Multi-mode validated with <code>minLength</code>.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
      template: `
  <cngx-form-field [field]="multiForm.toppings">
    <label cngxLabel>Beläge (mind. 2)</label>
    <cngx-select [label]="'Beläge'" [options]="toppings" [multiple]="true" placeholder="Beläge wählen…" />
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Field value</span>
      <span class="event-value">{{ multiForm.toppings().value().join(', ') || '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Valid</span>
      <span class="event-value">{{ multiForm.toppings().valid() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Reactive Forms — adapted via adaptFormControl',
      subtitle:
        'Same component, <code>[field]</code> receives the adapter output. Value, touched, and validators flow through.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
      template: `
  <cngx-form-field [field]="rfField">
    <label cngxLabel>Farbe (RF)</label>
    <cngx-select [label]="'Farbe (RF)'" [options]="colors" placeholder="Farbe wählen…" />
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">RF control value</span>
      <span class="event-value">{{ rfValue() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">RF control dirty</span>
      <span class="event-value">{{ rfControl.dirty ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
    },
  ],
};
