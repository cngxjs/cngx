import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHint: basic',
  subtitle: '<code>[cngxHint]</code> inside a <code>&lt;cngx-form-field&gt;</code> gets the field\'s hint id, and the input references it in <code>aria-describedby</code>.',
  description: 'The hint registers with the field presenter while it is rendered. The presenter adds the hint id to the control\'s <code>aria-describedby</code> only while a hint is registered, so a field without a hint carries no dangling reference. Screen readers read the hint after the label. WCAG 3.3.2 (Labels or Instructions).',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxHint', 'CngxFormField', 'CngxLabel'],
  moduleImports: [
    "import { form, schema, required, FormField } from '@angular/forms/signals';",
    "import { CngxFormField, CngxFormFieldPresenter, CngxHint, CngxLabel } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: ['FormField', 'CngxFormField', 'CngxLabel', 'CngxHint', 'CngxInput'],
  references: [
    { label: 'WCAG 3.3.2 Labels or Instructions', href: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html' },
  ],
  setup: `protected readonly model = signal<{ email: string }>({ email: '' });
  protected readonly account = form(this.model, schema((root) => {
    required(root.email);
  }));`,
  setupChrome: `protected readonly presenter = viewChild(CngxFormFieldPresenter);`,
  template: `  <div style="display:grid;gap:8px;max-width:360px">
    <cngx-form-field [field]="account.email">
      <label cngxLabel>Email</label>
      <input cngxInput type="email" [formField]="account.email" autocomplete="email" />
      <span cngxHint>Use your work address.</span>
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Hint id</span>
      <span class="event-value">{{ presenter()?.hintId() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Input aria-describedby</span>
      <span class="event-value">{{ presenter()?.describedBy() || '(none)' }}</span>
    </div>
  </div>`,
};
