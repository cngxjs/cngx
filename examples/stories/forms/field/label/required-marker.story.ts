import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLabel: required marker',
  subtitle: 'A field with a <code>required()</code> validator renders a marker inside the label. Either rely on the global <code>withRequiredMarker()</code> provider feature, or drop <code>&lt;cngx-required /&gt;</code> into the label body for one-off use.',
  description: 'The marker is decorative: <code>CngxRequired</code> sets <code>aria-hidden="true"</code>, so screen readers ignore it. Required state itself is announced through <code>aria-required</code> on the projected input, which the form-field presenter sets from the validator graph. Both labels below render the same visual marker; only the wiring differs.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxLabel',
    'CngxFormField',
    'CngxRequired',
  ],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxRequired } from '@cngx/forms/field';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxRequired'],
  setup: `protected readonly model = signal<{ email: string; phone: string }>({ email: '', phone: '' });
  protected readonly markerForm = form(this.model, schema((root) => {
    required(root.email, { message: 'Email is required.' });
    required(root.phone, { message: 'Phone is required.' });
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="markerForm.email">
      <label cngxLabel>Email <cngx-required /></label>
      <input type="email" />
    </cngx-form-field>

    <cngx-form-field [field]="markerForm.phone">
      <label cngxLabel>Phone <cngx-required marker="(required)" /></label>
      <input type="tel" />
    </cngx-form-field>
  </div>`,
};
