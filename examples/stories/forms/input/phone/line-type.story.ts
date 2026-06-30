import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPhoneInput: manual line type',
  subtitle:
    'Force the landline vs mobile grouping with <code>[lineType]</code> instead of waiting for the length-based auto switch.',
  description:
    'Auto picks the alternate by digit count; mobile/landline force it immediately - useful when the user already knows the line type.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxPhoneInput'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';",
    "import { CngxPhoneInput } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxHint', 'CngxPhoneInput'],
  setup: `private readonly phoneModel = signal({ phone: '' });
  private readonly phoneSchema = schema<{ phone: string }>((root) => {
    required(root.phone);
  });
  protected readonly phoneForm = form(this.phoneModel, this.phoneSchema);
  protected readonly phoneField = this.phoneForm.phone;
  protected readonly lineType = signal<'auto' | 'mobile' | 'landline'>('auto');
  protected setLineType(event: Event): void {
    this.lineType.set((event.target as HTMLSelectElement).value as 'auto' | 'mobile' | 'landline');
  }`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="phoneField">
        <label cngxLabel>Phone</label>
        <cngx-phone-input [lineType]="lineType()" />
        <span cngxHint>Switch the line type to force the grouping instantly</span>
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="demo-field">
        <label class="demo-label" for="line-type">Line type</label>
        <select id="line-type" class="demo-input" (change)="setLineType($event)">
          <option value="auto">Auto (by length)</option>
          <option value="mobile">Mobile</option>
          <option value="landline">Landline</option>
        </select>
      </div>
      <div class="status-row">
        <span class="status-badge">Line type: {{ lineType() }}</span>
        <span class="status-badge">Value: {{ phoneField().value() || '(empty)' }}</span>
      </div>`,
};
