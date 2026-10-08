import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: Reactive Forms',
  subtitle:
    'Bind <code>[formControl]</code> on a masked input and import <code>CngxFormBridge</code>: typed text reaches the control as the raw value, and <code>setValue</code> writes back into the mask.',
  description:
    'Type <code>14:30</code> and the control holds <code>1430</code>: the raw value without separators, the same value Signal Forms stores. An empty field holds an empty string, so <code>Validators.required</code> fires. <code>CngxFormBridge</code> attaches only to <code>[formControl]</code> / <code>[formControlName]</code>, so a <code>[formField]</code> binding on the same mask is unaffected.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  framework: 'reactive-forms',
  apiComponents: ['CngxInputMask', 'CngxFormBridge', 'CngxInput', 'CngxFormField', 'CngxFieldErrors'],
  moduleImports: [
    "import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { CngxFormBridge } from '@cngx/forms/controls';",
    "import { CngxFieldErrors, CngxFormField, CngxLabel, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxInput, CngxInputMask } from '@cngx/forms/input';",
    "import { timeRange } from '@cngx/forms/validators';",
  ],
  imports: [
    'ReactiveFormsModule',
    'CngxFormBridge',
    'CngxFormField',
    'CngxLabel',
    'CngxFieldErrors',
    'CngxInput',
    'CngxInputMask',
  ],
  setup: `private readonly destroyRef = inject(DestroyRef);
  protected readonly start = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, timeRange({ cycle: 24 })],
  });
  protected readonly startField = adaptFormControl(this.start, 'start', this.destroyRef);
  protected readonly contact = new FormGroup({
    phone: new FormControl('', { nonNullable: true }),
  });
  protected readonly phoneField = adaptFormControl(this.contact.controls.phone, 'phone', this.destroyRef);`,
  template: `
  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="startField">
      <label cngxLabel>Start time</label>
      <input cngxInput cngxInputMask="time:24" [formControl]="start" />
      <cngx-field-errors />
    </cngx-form-field>
    <form [formGroup]="contact">
      <cngx-form-field [field]="phoneField">
        <label cngxLabel>Phone</label>
        <input cngxInput cngxInputMask="phone" formControlName="phone" />
        <cngx-field-errors />
      </cngx-form-field>
    </form>
  </div>`,
  setupChrome: `protected handleToggleDisabled(): void {
    if (this.start.disabled) {
      this.start.enable();
    } else {
      this.start.disable();
    }
  }`,
  templateChrome: `
  <div class="button-row">
    <button type="button" class="chip" (click)="start.setValue('0915')">Set 09:15</button>
    <button type="button" class="chip" (click)="handleToggleDisabled()">
      {{ startField().disabled() ? 'Enable' : 'Disable' }}
    </button>
  </div>
  <div class="status-row">
    <span class="status-badge" data-testid="start-value">Start value: {{ startField().value() }}</span>
    <span class="status-badge" data-testid="start-dirty">Start dirty: {{ startField().dirty() }}</span>
    <span class="status-badge" data-testid="phone-value">Phone value: {{ phoneField().value() }}</span>
  </div>`,
};
