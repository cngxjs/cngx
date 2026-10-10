import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxNumericInput: Reactive Forms',
  subtitle:
    'Bind <code>[formControl]</code> on a numeric input and import <code>CngxFormBridge</code>: the control holds a <code>number</code>, never the display string.',
  description:
    'Type <code>1234,5</code> and leave the field: it shows <code>1.234,50</code> (de-DE) while the control holds <code>1234.5</code>, the same value Signal Forms stores. An empty field holds <code>null</code>, so <code>Validators.required</code> fires. The control follows every keystroke with the parsed number, so pressing Enter submits what you typed; <code>min</code>/<code>max</code> and rounding apply on blur. <code>setValue</code> renders formatted without marking the control dirty.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  framework: 'reactive-forms',
  apiComponents: ['CngxNumericInput', 'CngxFormBridge', 'CngxInput', 'CngxFormField', 'CngxFieldErrors'],
  moduleImports: [
    "import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { CngxFormBridge } from '@cngx/forms/controls';",
    "import { CngxFieldErrors, CngxFormField, CngxLabel, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxInput, CngxNumericInput } from '@cngx/forms/input';",
  ],
  imports: [
    'ReactiveFormsModule',
    'CngxFormBridge',
    'CngxFormField',
    'CngxLabel',
    'CngxFieldErrors',
    'CngxInput',
    'CngxNumericInput',
  ],
  setup: `private readonly destroyRef = inject(DestroyRef);
  protected readonly amount = new FormControl<number | null>(null, {
    validators: [Validators.required],
  });
  protected readonly amountField = adaptFormControl(this.amount, 'amount', this.destroyRef);
  protected readonly lastSubmitted = signal<number | null | undefined>(undefined);

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    this.lastSubmitted.set(this.amount.value);
  }`,
  template: `
  <form style="display:grid;gap:16px;max-width:360px" (submit)="handleSubmit($event)">
    <cngx-form-field [field]="amountField">
      <label cngxLabel>Amount</label>
      <input cngxInput cngxNumericInput [locale]="'de-DE'" [decimals]="2" [formControl]="amount" />
      <cngx-field-errors />
    </cngx-form-field>
    <button type="submit" class="chip" style="justify-self:start">Submit</button>
  </form>`,
  setupChrome: `protected handleToggleDisabled(): void {
    if (this.amount.disabled) {
      this.amount.enable();
    } else {
      this.amount.disable();
    }
  }`,
  templateChrome: `
  <div class="button-row">
    <button type="button" class="chip" (click)="amount.setValue(1234.5)">Set 1234.5</button>
    <button type="button" class="chip" (click)="amount.reset()">Reset</button>
    <button type="button" class="chip" (click)="handleToggleDisabled()">
      {{ amountField().disabled() ? 'Enable' : 'Disable' }}
    </button>
  </div>
  <div class="status-row">
    <span class="status-badge" data-testid="amount-value">Control value: {{ amountField().value() ?? 'null' }}</span>
    <span class="status-badge" data-testid="amount-dirty">Dirty: {{ amountField().dirty() }}</span>
    <span class="status-badge" data-testid="amount-touched">Touched: {{ amountField().touched() }}</span>
    <span class="status-badge" data-testid="amount-submitted">Submitted: {{ lastSubmitted() === undefined ? '—' : (lastSubmitted() ?? 'null') }}</span>
  </div>`,
};
