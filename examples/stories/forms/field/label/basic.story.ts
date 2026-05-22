import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLabel: Basic',
  subtitle: '<code>&lt;label cngxLabel&gt;</code> inside a <code>&lt;cngx-form-field&gt;</code> auto-wires <code>for</code> and <code>id</code> against the projected input. Click the label text to focus the input.',
  description: 'CngxLabel reads the field presenter, generates a stable id for the projected control, and sets <code>for</code> on the label host. No manual <code>id="..."</code> on the input, no manual <code>for="..."</code> on the label. WCAG 1.3.1 (Info and Relationships) and 3.3.2 (Labels or Instructions) are satisfied by construction.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxLabel',
    'CngxFormField',
  ],
  moduleImports: [
    "import { form, schema } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel } from '@cngx/forms/field';",
  ],
  imports: ['CngxFormField', 'CngxLabel'],
  references: [
    { label: 'WCAG 1.3.1 Info and Relationships', href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html' },
    { label: 'WCAG 3.3.2 Labels or Instructions', href: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html' },
  ],
  setup: `protected readonly model = signal<{ email: string }>({ email: '' });
  protected readonly basicForm = form(this.model, schema(() => {}));`,
  template: `  <div style="display:grid;gap:8px;max-width:360px">
    <cngx-form-field [field]="basicForm.email">
      <label cngxLabel>Email</label>
      <input type="email" />
    </cngx-form-field>
  </div>`,
};
