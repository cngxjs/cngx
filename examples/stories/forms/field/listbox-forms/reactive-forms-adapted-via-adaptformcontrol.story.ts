import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Reactive Forms — adapted via adaptFormControl',
  subtitle: 'Same template, <code>[field]</code> receives the adapter output. Listbox and bridge are unchanged.',
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
    'import { FormControl, Validators } from \'@angular/forms\';',
    'import { toSignal } from \'@angular/core/rxjs-interop\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, adaptFormControl, CngxListboxFieldBridge } from \'@cngx/forms/field\';',
    'import { CngxListbox, CngxOption } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxListbox', 'CngxOption', 'CngxListboxFieldBridge'],
  setup: `protected readonly rfControl = new FormControl<string>('green', { validators: [Validators.required], nonNullable: true });
  protected readonly rfField = adaptFormControl(this.rfControl, 'color', inject(DestroyRef));
  protected readonly rfValue = toSignal(this.rfControl.valueChanges, { initialValue: this.rfControl.value });`,
  template: `
  <cngx-form-field [field]="rfField">
    <label cngxLabel>Color (RF)</label>
    <div cngxListbox
         cngxListboxFieldBridge
         [label]="'Color (RF)'"
         tabindex="0">
      <div cngxOption value="red">Red</div>
      <div cngxOption value="green">Green</div>
      <div cngxOption value="blue">Blue</div>
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
};
