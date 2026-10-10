import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPhoneInput: Reactive Forms',
  subtitle:
    'Bind <code>[formControl]</code> on <code>cngx-phone-input</code> and import <code>CngxFormBridge</code>: the control holds the same value as the model.',
  description:
    'The field shows the dial code, but the control stays empty and pristine until national digits are typed; then it holds the dial-code-prefixed digits. Without <code>CngxFormBridge</code> in the imports Angular finds no value accessor and throws NG01203. Moving focus between the country picker and the number keeps the control untouched; leaving the component marks it touched.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'behavior'],
  framework: 'reactive-forms',
  apiComponents: ['CngxPhoneInput', 'CngxFormBridge'],
  moduleImports: [
    "import { FormControl, ReactiveFormsModule } from '@angular/forms';",
    "import { CngxFormBridge } from '@cngx/forms/controls';",
    "import { adaptFormControl } from '@cngx/forms/field';",
    "import { CngxPhoneInput } from '@cngx/forms/input';",
  ],
  imports: ['ReactiveFormsModule', 'CngxFormBridge', 'CngxPhoneInput'],
  setup: `protected readonly phone = new FormControl('', { nonNullable: true });`,
  template: `
  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-phone-input ariaLabel="Phone number" [formControl]="phone" />
  </div>`,
  setupChrome: `private readonly destroyRef = inject(DestroyRef);
  protected readonly phoneField = adaptFormControl(this.phone, 'phone', this.destroyRef);
  protected handleToggleDisabled(): void {
    if (this.phone.disabled) {
      this.phone.enable();
    } else {
      this.phone.disable();
    }
  }`,
  templateChrome: `
  <div class="button-row">
    <button type="button" class="chip" (click)="phone.setValue('12025550123')">Set +1 202 555 0123</button>
    <button type="button" class="chip" (click)="phone.reset()">Reset</button>
    <button type="button" class="chip" (click)="handleToggleDisabled()">
      {{ phoneField().disabled() ? 'Enable' : 'Disable' }}
    </button>
  </div>
  <div class="status-row">
    <span class="status-badge" data-testid="phone-value">Control value: {{ phoneField().value() || '(empty)' }}</span>
    <span class="status-badge" data-testid="phone-dirty">Dirty: {{ phoneField().dirty() }}</span>
    <span class="status-badge" data-testid="phone-touched">Touched: {{ phoneField().touched() }}</span>
  </div>`,
};
