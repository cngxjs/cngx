import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPhoneInput: metadata adapter',
  subtitle:
    'Provide a <code>CngxPhoneMetadata</code> strategy and the <code>auto</code> line type switches to the mobile grouping the moment the prefix is decisive - no length threshold, and the typed digits stay put.',
  description:
    'A tiny inline adapter (DE 1[567] -> mobile) stands in for a real numbering-metadata library like libphonenumber-js, which stays in the consumer dependency graph, never cngx. It is wired through viewProviders, so the strategy is scoped to this component subtree. Type a DE number starting 15/16/17 and the grouping regroups instantly while the entered digits are preserved.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxPhoneInput'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';",
    "import { CngxPhoneInput, providePhoneMetadata, type Country } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxHint', 'CngxPhoneInput'],
  viewProviders: [
    "providePhoneMetadata({ lineType: (_region, national) => (/^1[567]/.test(national) ? 'mobile' : 'unknown') })",
  ],
  setup: `private readonly phoneModel = signal({ phone: '' });
  private readonly phoneSchema = schema<{ phone: string }>((root) => {
    required(root.phone);
  });
  protected readonly phoneForm = form(this.phoneModel, this.phoneSchema);
  protected readonly phoneField = this.phoneForm.phone;
  protected readonly countries: Country[] = [
    { region: 'DE', dialCode: '+49', label: 'Germany' },
    { region: 'AT', dialCode: '+43', label: 'Austria' },
    { region: 'US', dialCode: '+1', label: 'United States' },
  ];
  protected readonly country = signal<Country>(this.countries[0]);`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="phoneField">
        <label cngxLabel>Phone number</label>
        <cngx-phone-input [countries]="countries" [(country)]="country" />
        <span cngxHint>Type a German number starting 15, 16 or 17 - the grouping switches to mobile immediately</span>
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Country: {{ country().label }}</span>
        <span class="status-badge">Value: {{ phoneField().value() || '(empty)' }}</span>
      </div>`,
};
