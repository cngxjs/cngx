import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPhoneInput: international phone',
  subtitle:
    'A country picker (<code>CngxSelect</code>) wired to a region-aware mask (<code>CngxInputMask</code>): the country re-targets the mask, and DE/AT/IT/BR switch landline vs mobile by length.',
  description:
    'Cross-family composition - one field-control out of a select and a mask, with the mask region a computed of the selected country.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxPhoneInput'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';",
    "import { CngxPhoneInput, type Country } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxHint', 'CngxPhoneInput'],
  setup: `private readonly phoneModel = signal({ phone: '' });
  private readonly phoneSchema = schema<{ phone: string }>((root) => {
    required(root.phone);
  });
  protected readonly phoneForm = form(this.phoneModel, this.phoneSchema);
  protected readonly phoneField = this.phoneForm.phone;
  protected readonly countries: Country[] = [
    { region: 'DE', dialCode: '+49', label: 'Germany' },
    { region: 'AT', dialCode: '+43', label: 'Austria' },
    { region: 'IT', dialCode: '+39', label: 'Italy' },
    { region: 'US', dialCode: '+1', label: 'United States' },
  ];
  protected readonly country = signal<Country>(this.countries[0]);`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="phoneField">
        <label cngxLabel>Phone number</label>
        <cngx-phone-input [countries]="countries" [(country)]="country" />
        <span cngxHint>Pick a country, then type - a longer number switches to the mobile grouping</span>
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Country: {{ country().label }}</span>
        <span class="status-badge">Value: {{ phoneField().value() || '(empty)' }}</span>
      </div>`,
};
