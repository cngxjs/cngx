import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldSkinHost: fill skin',
  subtitle: 'Set <code>skin="fill"</code> on <code>&lt;cngx-form-field&gt;</code> and every control inside renders a tinted surface with a bottom underline that grows on focus. No wrapper element is added; the input itself is the box.',
  description: 'The field publishes its <code>[skin]</code> through <code>CNGX_FORM_FIELD_HOST</code> and <code>CngxInput</code> writes it to its own host as <code>data-skin</code>. With affixes, <code>CngxFieldBox</code> reads the same value and becomes the box, so the underline spans prefix, value and suffix while the nested input drops its own surface. Error, disabled and readonly states key on <code>aria-invalid</code>, <code>:disabled</code> and <code>aria-readonly</code>, so the underline turns red at the same moment the error is announced. Blur the empty amount field to see it. The toggle switches the skin at runtime; <code>outline</code> writes no attribute at all.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldSkinHost', 'CngxFormField', 'CngxFieldBox', 'CngxInput'],
  moduleImports: [
    'import { form, schema, required, pattern, FormField } from \'@angular/forms/signals\';',
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
    'import type { CngxFieldSkin } from \'@cngx/forms/field\';',
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
    'CngxRadioGroup',
    'CngxRadio',
  ],
  references: [
    { label: 'WCAG 1.4.11 Non-text Contrast', href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html' },
    { label: 'WCAG 2.4.7 Focus Visible', href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html' },
  ],
  setup: `private readonly model = signal({ name: '', amount: '' });
  protected readonly orderForm = form(this.model, schema<{ name: string; amount: string }>((root) => {
    required(root.name, { message: 'Name is required.' });
    required(root.amount, { message: 'Amount is required.' });
    pattern(root.amount, /^\\d+(\\.\\d{1,2})?$/, { message: 'Use a number with up to two decimals.' });
  }));
  protected readonly skin = signal<CngxFieldSkin>('fill');`,
  template: `  <div style="display:grid;gap:16px;max-inline-size:24rem">
    <cngx-form-field [field]="orderForm.name" [skin]="skin()">
      <label cngxLabel>Name on invoice</label>
      <input cngxInput [formField]="orderForm.name" autocomplete="name" />
      <span cngxHint>As it should appear on the invoice.</span>
      <cngx-field-errors />
    </cngx-form-field>

    <cngx-form-field [field]="orderForm.amount" [skin]="skin()">
      <label cngxLabel>Amount</label>
      <span cngxFieldBox>
        <span cngxPrefix>EUR</span>
        <input cngxInput [formField]="orderForm.amount" inputmode="decimal" />
        <span cngxSuffix>/ month</span>
      </span>
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active skin</span><span class="event-value">{{ skin() }}</span></div>
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
      </cngx-radio-group>
    </div>
  </div>`,
};
