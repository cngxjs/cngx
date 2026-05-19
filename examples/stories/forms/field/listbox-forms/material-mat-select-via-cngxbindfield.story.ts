import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Material mat-select via CngxBindField',
  subtitle: 'Universal bridge pattern: <code>[cngxBindField]</code> on any Material / native / custom control. All form-field state (ID, empty, focused, disabled, errorState) derives from the bound field via the presenter — no control-specific bridge needed.',
  description: 'CngxListbox integrated into <cngx-form-field> via CngxListboxFieldBridge, plus the universal CngxBindField bridge for any other control (mat-select, native inputs, custom controls).',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxListboxFieldBridge',
    'CngxBindField',
    'CngxListbox',
    'CngxOption',
    'CngxFormField',
  ],
  moduleImports: [
    'import { form, required } from \'@angular/forms/signals\';',
    'import { FormControl, ReactiveFormsModule, Validators } from \'@angular/forms\';',
    'import { toSignal } from \'@angular/core/rxjs-interop\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl, CngxBindField } from \'@cngx/forms/field\';',
    'import { MatSelect } from \'@angular/material/select\';',
    'import { MatOption } from \'@angular/material/core\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxBindField', 'MatSelect', 'MatOption', 'ReactiveFormsModule'],
  setup: `protected readonly matSelectControl = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });
  protected readonly matSelectField = adaptFormControl(this.matSelectControl, 'size', inject(DestroyRef));`,
  setupChrome: `  protected readonly matSelectValue = toSignal(this.matSelectControl.valueChanges, { initialValue: this.matSelectControl.value });
  protected handleMatSelectSubmit(): void {
    this.matSelectField().markAsTouched();
  }`,
  template: `  <cngx-form-field [field]="matSelectField">
    <label cngxLabel>Size</label>
    <mat-select cngxBindField
                [formControl]="matSelectControl"
                placeholder="Choose…"
                style="min-width:200px;display:inline-block">
      <mat-option value="s">Small</mat-option>
      <mat-option value="m">Medium</mat-option>
      <mat-option value="l">Large</mat-option>
      <mat-option value="xl">X-Large</mat-option>
    </mat-select>
    <cngx-field-errors />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
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
};
