import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Listbox Forms',
  navLabel: 'Listbox Forms',
  navCategory: 'field',
  description:
    'CngxListbox integrated into <cngx-form-field> via CngxListboxFieldBridge, plus the universal CngxBindField bridge for any other control (mat-select, native inputs, custom controls).',
  apiComponents: ['CngxListboxFieldBridge', 'CngxBindField', 'CngxListbox', 'CngxOption', 'CngxFormField'],
  overview:
    '<p>The listbox atom in <code>@cngx/common/interactive</code> stays Forms-agnostic. ' +
    'A sibling directive <code>[cngxListboxFieldBridge]</code> in <code>@cngx/forms/field</code> provides ' +
    '<code>CNGX_FORM_FIELD_CONTROL</code>, syncs the listbox value with the bound field, and projects ARIA.</p>' +
    '<p><code>[cngxBindField]</code> is the universal counterpart for any control that already has its own value flow — Material (<code>mat-select</code>, <code>mat-chip-grid</code>, …), native HTML (<code>&lt;select&gt;</code>, <code>&lt;input&gt;</code>), or custom <code>FormValueControl&lt;T&gt;</code> / CVA components. It derives all form-field state purely from the field via the presenter.</p>',
  moduleImports: [
    "import { form, schema, required, minLength, submit } from '@angular/forms/signals';",
    "import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { DestroyRef } from '@angular/core';",
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl, CngxListboxFieldBridge, CngxBindField } from '@cngx/forms/field';",
    "import { CngxListbox, CngxOption } from '@cngx/common/interactive';",
    "import { MatSelect } from '@angular/material/select';",
    "import { MatOption } from '@angular/material/core';",
  ],
  setup: `
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

  // ── Reactive Forms single ────────────────────────────────
  protected readonly rfControl = new FormControl<string>('green', { validators: [Validators.required], nonNullable: true });
  protected readonly rfField = adaptFormControl(this.rfControl, 'color', inject(DestroyRef));
  protected readonly rfValue = toSignal(this.rfControl.valueChanges, { initialValue: this.rfControl.value });
  protected readonly rfTouched = signal(false);

  // ── mat-select via CngxBindField ─────────────────────────
  protected readonly matSelectControl = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });
  protected readonly matSelectField = adaptFormControl(this.matSelectControl, 'size', inject(DestroyRef));
  protected readonly matSelectValue = toSignal(this.matSelectControl.valueChanges, { initialValue: this.matSelectControl.value });

  protected handleSingleSubmit(): void {
    submit(this.singleForm, async () => []);
  }
  protected handleMultiSubmit(): void {
    submit(this.multiForm, async () => []);
  }
  protected handleMatSelectSubmit(): void {
    this.matSelectControl.markAsTouched();
  }
  `,
  sections: [
    {
      title: 'Signal Forms — single select',
      subtitle:
        'Two-way binding via <code>[(value)]="singleForm.color().value"</code>. Required validation shown when touched.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxListbox', 'CngxOption', 'CngxListboxFieldBridge'],
      template: `
  <cngx-form-field [field]="singleForm.color">
    <label cngxLabel>Lieblingsfarbe</label>
    <div cngxListbox
         cngxListboxFieldBridge
         [label]="'Lieblingsfarbe'"
         tabindex="0">
      <div cngxOption value="red">Rot</div>
      <div cngxOption value="green">Grün</div>
      <div cngxOption value="blue">Blau</div>
    </div>
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
      subtitle: 'Multi-select mit <code>minLength</code> validator. Selection pushed into field array.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxListbox', 'CngxOption', 'CngxListboxFieldBridge'],
      template: `
  <cngx-form-field [field]="multiForm.toppings">
    <label cngxLabel>Beläge (mind. 2)</label>
    <div cngxListbox
         cngxListboxFieldBridge
         [label]="'Beläge'"
         [multiple]="true"
         tabindex="0">
      <div cngxOption value="cheese">Käse</div>
      <div cngxOption value="pepperoni">Pepperoni</div>
      <div cngxOption value="mushroom">Champignons</div>
      <div cngxOption value="olive">Oliven</div>
      <div cngxOption value="onion">Zwiebel</div>
    </div>
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
      title: 'Material mat-select via CngxBindField',
      subtitle:
        'Universal bridge pattern: <code>[cngxBindField]</code> on any Material / native / custom control. ' +
        'All form-field state (ID, empty, focused, disabled, errorState) derives from the bound field via the presenter — ' +
        'no control-specific bridge needed.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxBindField', 'MatSelect', 'MatOption', 'ReactiveFormsModule'],
      template: `
  <cngx-form-field [field]="matSelectField">
    <label cngxLabel>Größe</label>
    <mat-select cngxBindField
                [formControl]="matSelectControl"
                placeholder="Bitte wählen"
                style="min-width:200px;display:inline-block">
      <mat-option value="s">Small</mat-option>
      <mat-option value="m">Medium</mat-option>
      <mat-option value="l">Large</mat-option>
      <mat-option value="xl">X-Large</mat-option>
    </mat-select>
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">mat-select value</span>
      <span class="event-value">{{ matSelectValue() || '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Valid</span>
      <span class="event-value">{{ matSelectControl.valid ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Touched</span>
      <span class="event-value">{{ matSelectControl.touched ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="handleMatSelectSubmit()">Touch</button>
    </div>
  </div>`,
    },
    {
      title: 'Reactive Forms — adapted via adaptFormControl',
      subtitle:
        'Same template, <code>[field]</code> receives the adapter output. Listbox and bridge are unchanged.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxListbox', 'CngxOption', 'CngxListboxFieldBridge'],
      template: `
  <cngx-form-field [field]="rfField">
    <label cngxLabel>Farbe (RF)</label>
    <div cngxListbox
         cngxListboxFieldBridge
         [label]="'Farbe (RF)'"
         tabindex="0">
      <div cngxOption value="red">Rot</div>
      <div cngxOption value="green">Grün</div>
      <div cngxOption value="blue">Blau</div>
    </div>
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
