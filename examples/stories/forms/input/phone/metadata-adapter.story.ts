import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPhoneInput: metadata adapter',
  subtitle:
    'Build a <code>CngxPhoneMetadata</code> strategy from a region keyed prefix map with <code>createPrefixPhoneMetadata</code>, and the <code>auto</code> line type switches to the mobile grouping the moment the prefix is decisive - no length threshold, and the typed digits stay put.',
  description:
    'createPrefixPhoneMetadata turns a region keyed prefix map (DE mobile via /^1[567]/, AT mobile via the real NDC set 0650/0660/0664/0676/0699 and friends) into the adapter, so you declare the prefixes that matter instead of hand-writing the region branch. It ships no numbering data - the consumer supplies every prefix, mirroring a real library like libphonenumber-js, which stays in the consumer dependency graph, never cngx. It is wired through viewProviders, so the strategy is scoped to this component subtree. Type a DE number starting 15/16/17 (or switch to AT and type 0664/0660/0699) and the grouping regroups to the 3-digit mobile alternation the moment the prefix is decisive, while the entered digits are preserved. Landline grouping per area code is out of scope for a line-type strategy - that needs as-you-type formatting from a real metadata library.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxPhoneInput'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';",
    "import { CngxPhoneInput, providePhoneMetadata, createPrefixPhoneMetadata, type Country } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxHint', 'CngxPhoneInput'],
  viewProviders: [
    "providePhoneMetadata(createPrefixPhoneMetadata({ DE: { mobile: [/^1[567]/] }, AT: { mobile: ['650','660','664','665','667','670','676','677','678','680','681','686','688','690','699'] } }))",
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
        <span cngxHint>Type a DE number starting 15/16/17, or an AT mobile (0664, 0660, 0699, ...) - the grouping switches to mobile immediately</span>
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Country: {{ country().label }}</span>
        <span class="status-badge">Value: {{ phoneField().value() || '(empty)' }}</span>
      </div>`,
};
