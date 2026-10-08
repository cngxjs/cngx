import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputFormat: Reactive Forms',
  subtitle:
    'Bind <code>[formControl]</code> on a formatted input and import <code>CngxFormBridge</code>: the control holds the raw value at all times, also while the field shows the formatted text.',
  description:
    'Type <code>12345678</code> and leave the field: it shows <code>1234 5678</code> while the control keeps <code>12345678</code>. Focus and blur emit nothing because <code>parse</code> inverts <code>format</code>; a <code>parse</code> that does not would write on every focus.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  framework: 'reactive-forms',
  apiComponents: ['CngxInputFormat', 'CngxFormBridge', 'CngxInput', 'CngxFormField', 'CngxFieldErrors'],
  moduleImports: [
    "import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { CngxFormBridge } from '@cngx/forms/controls';",
    "import { CngxFieldErrors, CngxFormField, CngxLabel, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxInput, CngxInputFormat } from '@cngx/forms/input';",
  ],
  imports: [
    'ReactiveFormsModule',
    'CngxFormBridge',
    'CngxFormField',
    'CngxLabel',
    'CngxFieldErrors',
    'CngxInput',
    'CngxInputFormat',
  ],
  setup: `// Add CngxFormBridge to the component's imports: it attaches by selector to [formControl] on the formatted input.
  private readonly destroyRef = inject(DestroyRef);
  protected readonly groupDigits = (raw: string) => raw.replace(/(\\d{4})(?=\\d)/g, '$1 ');
  protected readonly ungroupDigits = (display: string) => display.replace(/\\s/g, '');
  protected readonly account = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly accountField = adaptFormControl(this.account, 'account', this.destroyRef);`,
  template: `
  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="accountField">
      <label cngxLabel>Account number</label>
      <input
        cngxInput
        inputmode="numeric"
        [cngxInputFormat]="groupDigits"
        [parse]="ungroupDigits"
        [formControl]="account"
      />
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
  templateChrome: `
  <div class="button-row">
    <button type="button" class="chip" (click)="account.setValue('87654321')">Set 87654321</button>
  </div>
  <div class="status-row">
    <span class="status-badge" data-testid="account-value">Control value: {{ accountField().value() }}</span>
    <span class="status-badge" data-testid="account-dirty">Dirty: {{ accountField().dirty() }}</span>
  </div>`,
};
