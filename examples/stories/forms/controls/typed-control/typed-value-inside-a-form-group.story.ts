import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTypedControl: Typed value inside a form group',
  subtitle:
    '<code>cngxTypedControl="name"</code> looks the control up in the enclosing <code>[formGroup]</code> and exposes it as the <code>control()</code> signal, so a template reads <code>hasError</code>, <code>value</code> or <code>status</code> through a ref instead of repeating <code>form.get(name)</code>.',
  description:
    'Type into both fields: the readout reads each value through the directive ref. The quantity stays a <code>number</code> (the number input accessor writes numbers, or <code>null</code> for an empty field), the item a <code>string</code>. In a template ref the generic is <code>unknown</code>; inject the directive as <code>CngxTypedControl&lt;number&gt;</code> in TypeScript to get the narrowed control. The directive injects <code>FormGroupDirective</code>, so it only works inside a <code>[formGroup]</code>, and it throws when the group has no control of that name.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration'],
  framework: 'reactive-forms',
  apiComponents: ['CngxTypedControl'],
  moduleImports: [
    "import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { CngxTypedControl } from '@cngx/forms/controls';",
  ],
  imports: ['ReactiveFormsModule', 'CngxTypedControl'],
  setup: `protected readonly order = new FormGroup({
    item: new FormControl('Notebook', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl(2, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(10)],
    }),
  });`,
  template: `<form [formGroup]="order" class="cngx-ex-stack-form">
    <label for="typed-control-item">Item</label>
    <input
      id="typed-control-item"
      type="text"
      formControlName="item"
      cngxTypedControl="item"
      #item="cngxTypedControl"
    />
    <label for="typed-control-quantity">Quantity (1 to 10)</label>
    <input
      id="typed-control-quantity"
      type="number"
      formControlName="quantity"
      cngxTypedControl="quantity"
      #quantity="cngxTypedControl"
      [attr.aria-invalid]="quantity.control()?.invalid"
      [attr.aria-describedby]="quantity.control()?.invalid ? 'typed-control-quantity-error' : null"
    />
    <p id="typed-control-quantity-error" class="cngx-ex-form-error">
      @if (quantity.control()?.invalid) {
        Enter a quantity from 1 to 10.
      }
    </p>
  </form>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">item.control()?.value</span>
      <span class="event-value">{{ item.control()?.value }} ({{ typeof item.control()?.value }})</span>
    </div>
    <div class="event-row">
      <span class="event-label">quantity.control()?.value</span>
      <span class="event-value">{{ quantity.control()?.value ?? 'null' }} ({{ typeof quantity.control()?.value }})</span>
    </div>
    <div class="event-row">
      <span class="event-label">quantity.control()?.status</span>
      <span class="event-value">{{ quantity.control()?.status }}</span>
    </div>
  </div>`,
};
