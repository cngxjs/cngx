import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Material Integration',
  navLabel: 'Material',
  navCategory: 'field',
  description:
    'Use any Angular Material form control inside cngx-form-field via the universal CngxBindField directive.',
  apiComponents: ['CngxBindField'],
  overview:
    '<p><code>[cngxBindField]</code> is the universal bridge from any control — Material, native HTML, or ' +
    'a custom component — to <code>&lt;cngx-form-field&gt;</code>. Place it on the same element as the Material ' +
    'control; cngx derives <code>id</code>, <code>aria-*</code>, <code>empty</code>, <code>focused</code>, ' +
    '<code>disabled</code>, and <code>errorState</code> purely from the bound <code>Field</code> via the presenter.</p>' +
    '<p>Value-flow goes through the control\'s own bindings — <code>[control]</code> (Signal Forms) or ' +
    '<code>[formControl]</code> (Reactive Forms). cngx never touches the value layer.</p>' +
    '<p>An optional Material theme mixin (<code>@cngx/forms/field/material-theme</code>) maps M3/M2 design ' +
    'tokens to cngx-form-field CSS custom properties.</p>',
  moduleImports: [
    "import { form, schema, required, FormField } from '@angular/forms/signals';",
    "import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { DestroyRef } from '@angular/core';",
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, CngxBindField, adaptFormControl } from '@cngx/forms/field';",
    "import { MatFormField } from '@angular/material/form-field';",
    "import { MatInput } from '@angular/material/input';",
    "import { MatSelect } from '@angular/material/select';",
    "import { MatOption } from '@angular/material/core';",
  ],
  setup: `
  private readonly model = signal({ name: '', website: '' });
  private readonly matSchema = schema<{ name: string; website: string }>(root => {
    required(root.name);
    required(root.website);
  });
  protected readonly matForm = form(this.model, this.matSchema);
  protected readonly nameField = this.matForm.name;
  protected readonly websiteField = this.matForm.website;

  protected readonly matSelectControl = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });
  protected readonly matSelectField = adaptFormControl(this.matSelectControl, 'priority', inject(DestroyRef));
  protected readonly matSelectValue = toSignal(this.matSelectControl.valueChanges, { initialValue: this.matSelectControl.value });

  protected touchAll(): void {
    this.nameField().markAsTouched();
    this.websiteField().markAsTouched();
    this.matSelectControl.markAsTouched();
  }
  `,
  sections: [
    {
      title: 'matInput via CngxBindField',
      subtitle:
        '<code>mat-form-field</code> provides the Material input chrome. <code>cngx-form-field</code> provides ' +
        'the A11y coordination. Add <code>cngxBindField</code> on the same element as <code>matInput</code>.',
      imports: [
        'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'FormField',
        'CngxBindField', 'MatFormField', 'MatInput',
      ],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="nameField">
        <label cngxLabel>Name</label>
        <mat-form-field appearance="outline" style="width:100%">
          <input matInput cngxBindField [formField]="nameField" placeholder="Jane Doe" />
        </mat-form-field>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="websiteField">
        <label cngxLabel>Website</label>
        <mat-form-field appearance="outline" style="width:100%">
          <input matInput cngxBindField [formField]="websiteField" placeholder="https://example.com" />
        </mat-form-field>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <button class="chip" (click)="touchAll()">Touch all fields</button>

    <div class="status-row">
      <span class="status-badge">Name valid: {{ nameField().valid() }}</span>
      <span class="status-badge">Website valid: {{ websiteField().valid() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'mat-select via CngxBindField + Reactive Forms',
      subtitle:
        'Same directive, different Material control and a Reactive-Forms value source. <code>adaptFormControl</code> ' +
        'wraps the <code>FormControl</code> as a <code>Field&lt;T&gt;</code> for <code>cngx-form-field</code>; ' +
        '<code>[formControl]</code> on the <code>mat-select</code> handles value-flow.',
      imports: [
        'CngxFormField', 'CngxLabel', 'CngxFieldErrors',
        'CngxBindField', 'MatSelect', 'MatOption', 'ReactiveFormsModule',
      ],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="matSelectField">
        <label cngxLabel>Priorität</label>
        <mat-select cngxBindField [formControl]="matSelectControl" placeholder="Bitte wählen"
                    style="min-width:220px;display:inline-block">
          <mat-option value="low">Niedrig</mat-option>
          <mat-option value="normal">Normal</mat-option>
          <mat-option value="high">Hoch</mat-option>
          <mat-option value="urgent">Dringend</mat-option>
        </mat-select>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="status-row">
      <span class="status-badge">Selected: {{ matSelectValue() || '—' }}</span>
      <span class="status-badge">Valid: {{ matSelectControl.valid }}</span>
      <span class="status-badge">Touched: {{ matSelectControl.touched }}</span>
    </div>
  </div>`,
    },
  ],
};
