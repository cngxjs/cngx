import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLabel: inner label in a fill box',
  subtitle: 'Place <code>&lt;label cngxLabel&gt;</code> as a direct child of <code>cngxFieldBox</code> and it renders inside the surface, on its own line above the value. Static, no float.',
  description: 'Placement is composition, not an input: the same <code>CngxLabel</code> becomes an inner label only because it sits inside the box. The box wraps onto two lines, a 14px label line over the 24px value line, and grows to 56px with its padding and border unchanged. Affixes stay on the value line, and error and disabled states tint the label through the presenter classes. Every field in this form places its label inside the box; mixing inner and outer labels in one form reads as two different controls. Blur the empty reference field to see the error.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxLabel', 'CngxFieldBox', 'CngxFormField', 'CngxInput'],
  moduleImports: [
    'import { form, schema, required, disabled, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxHint, CngxFieldErrors, CngxFieldBox, CngxPrefix, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput } from \'@cngx/forms/input\';',
  ],
  imports: [
    'CngxFormField',
    'CngxLabel',
    'CngxHint',
    'CngxFieldErrors',
    'CngxFieldBox',
    'CngxPrefix',
    'CngxSuffix',
    'CngxInput',
    'FormField',
  ],
  references: [
    { label: 'WCAG 1.3.1 Info and Relationships', href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html' },
    { label: 'WCAG 2.5.3 Label in Name', href: 'https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html' },
  ],
  setup: `private readonly model = signal({ name: '', amount: '', reference: '', account: 'DE-4471' });
  protected readonly orderForm = form(this.model, schema<{ name: string; amount: string; reference: string; account: string }>((root) => {
    required(root.reference, { message: 'Reference is required.' });
    disabled(root.account, () => true);
  }));`,
  template: `  <div style="display:grid;gap:16px;max-inline-size:24rem">
    <cngx-form-field [field]="orderForm.name" skin="fill">
      <span cngxFieldBox>
        <label cngxLabel>Name on invoice</label>
        <input cngxInput [formField]="orderForm.name" autocomplete="name" />
      </span>
    </cngx-form-field>

    <cngx-form-field [field]="orderForm.amount" skin="fill">
      <span cngxFieldBox>
        <label cngxLabel>Amount</label>
        <span cngxPrefix>EUR</span>
        <input cngxInput [formField]="orderForm.amount" inputmode="decimal" />
        <span cngxSuffix>/ month</span>
      </span>
    </cngx-form-field>

    <cngx-form-field [field]="orderForm.reference" skin="fill">
      <span cngxFieldBox>
        <label cngxLabel>Order reference</label>
        <input cngxInput [formField]="orderForm.reference" />
      </span>
      <span cngxHint>Printed on the invoice header.</span>
      <cngx-field-errors />
    </cngx-form-field>

    <cngx-form-field [field]="orderForm.account" skin="fill">
      <span cngxFieldBox>
        <label cngxLabel>Billing account</label>
        <input cngxInput [formField]="orderForm.account" />
      </span>
    </cngx-form-field>
  </div>`,
};
