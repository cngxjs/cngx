import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPrefix: select-in-field affix',
  subtitle: 'An amount field with a currency picker in front of the value, inside one <code>&lt;cngx-form-field&gt;</code>. The affix row is the box, so picker and amount share one surface and one underline.',
  description: 'A field has exactly one control: here the amount input, which owns the label, the ARIA state and the value. The currency <code>&lt;cngx-select&gt;</code> is a second control living inside that field, so it must be detached from it. The <code>demoAffixDetach</code> directive, a sibling file of this story, provides <code>CngxFormFieldPresenter</code> as <code>null</code> for the select element. Without it the select would register a competing <code>CNGX_FORM_FIELD_CONTROL</code>, copy the amount field\'s error state, and try to write the currency into the amount. The select keeps its own accessible name through <code>[label]</code>; <code>cngxPrefixInteractive</code> keeps it in the tab order. The row is the field box: the nested select resolves to bare and drops its trigger chrome, so the row draws the only surface, border and underline in every skin. The same shield sits inside <code>CngxPhoneInput</code> for its country picker.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  framework: 'signal-forms',
  apiComponents: ['CngxPrefix', 'CngxFieldBox', 'CngxSelect', 'CngxFormField'],
  moduleImports: [
    'import { form, schema, required, pattern, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, CngxFieldBox, CngxPrefix } from \'@cngx/forms/field\';',
    'import { CngxInput } from \'@cngx/forms/input\';',
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { DemoAffixDetach } from \'./_affix-detach.directive\';',
  ],
  imports: [
    'CngxFormField',
    'CngxLabel',
    'CngxFieldErrors',
    'CngxFieldBox',
    'CngxPrefix',
    'CngxInput',
    'CngxSelect',
    'FormField',
    'DemoAffixDetach',
  ],
  setup: `protected readonly currencies: CngxSelectOptionDef<string>[] = [
    { value: 'EUR', label: 'EUR' },
    { value: 'CHF', label: 'CHF' },
    { value: 'USD', label: 'USD' },
  ];
  protected readonly currency = signal<string | undefined>('EUR');
  private readonly model = signal({ amount: '' });
  protected readonly paymentForm = form(this.model, schema<{ amount: string }>((root) => {
    required(root.amount, { message: 'Amount is required.' });
    pattern(root.amount, /^\\d+(\\.\\d{1,2})?$/, { message: 'Use a number with up to two decimals.' });
  }));`,
  template: `  <div style="max-inline-size:24rem">
    <cngx-form-field [field]="paymentForm.amount" skin="fill">
      <label cngxLabel>Transfer amount</label>
      <span cngxFieldBox>
        <cngx-select cngxPrefix cngxPrefixInteractive demoAffixDetach
          [label]="'Currency'" [options]="currencies" [(value)]="currency" />
        <input cngxInput [formField]="paymentForm.amount" inputmode="decimal" />
      </span>
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Currency</span><span class="event-value">{{ currency() }}</span></div>
    <div class="event-row"><span class="event-label">Amount</span><span class="event-value">{{ paymentForm.amount().value() || '(empty)' }}</span></div>
  </div>`,
};
