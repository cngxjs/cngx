import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: reactive forms adaptformcontrol',
  subtitle: '<code>adaptFormControl</code> wraps the <code>FormControl</code> as a <code>Field&lt;T&gt;</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
  ],
  moduleImports: [
    'import { form, required } from \'@angular/forms/signals\';',
    'import { FormControl, Validators } from \'@angular/forms\';',
    'import { toSignal } from \'@angular/core/rxjs-interop\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl } from \'@cngx/forms/field\';',
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly rfControl = new FormControl<string>('green', { validators: [Validators.required], nonNullable: true });
  protected readonly rfField = adaptFormControl(this.rfControl, 'color', inject(DestroyRef));`,
  setupChrome: `  protected readonly rfValue = toSignal(this.rfControl.valueChanges, { initialValue: this.rfControl.value });`,
  template: `  <cngx-form-field [field]="rfField">
    <label cngxLabel>Color (RF)</label>
    <cngx-select [label]="'Color (RF)'" [options]="colors" placeholder="Pick a color…" />
    <cngx-field-errors />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">RF control value</span><span class="event-value">{{ rfValue() }}</span></div>
    <div class="event-row"><span class="event-label">RF control dirty</span><span class="event-value">{{ rfControl.dirty ? 'yes' : 'no' }}</span></div>
  </div>`,
};
