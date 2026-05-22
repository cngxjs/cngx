import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRequired: basic',
  subtitle:
    'Drop <code>&lt;cngx-required /&gt;</code> inside <code>&lt;label cngxLabel&gt;</code>. The marker renders only while the field carries a <code>required</code> validator. Toggle the validator below and watch the asterisk appear or disappear without any template change.',
  description:
    'CngxRequired reads the surrounding form-field presenter and renders its marker only when the field is required. Screen readers ignore the visual marker (the host is <code>aria-hidden="true"</code>); the input itself communicates the required state via <code>aria-required</code> projected by <code>&lt;cngx-form-field&gt;</code>.',
  level: 'atom',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxRequired', 'CngxLabel', 'CngxFormField'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxRequired } from '@cngx/forms/field';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxRequired', 'FormsModule'],
  references: [
    {
      label: 'WCAG 3.3.2 Labels or Instructions',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
    },
    {
      label: 'WAI-ARIA aria-required',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-required',
    },
  ],
  setup: `protected readonly model = signal<{ email: string }>({ email: '' });
  protected readonly requiredForm = form(this.model, schema((root) => {
    required(root.email, { message: 'Please enter an email' });
  }));
  protected readonly optionalForm = form(this.model);`,
  setupChrome: `protected readonly mandatory = signal(true);`,
  template: `  <div style="display:grid;gap:16px;max-width:420px">
    <cngx-form-field [field]="mandatory() ? requiredForm.email : optionalForm.email">
      <label cngxLabel>Email <cngx-required /></label>
      <input
        type="email"
        [ngModel]="mandatory() ? requiredForm.email().value() : optionalForm.email().value()"
        (ngModelChange)="mandatory() ? requiredForm.email().value.set($event) : optionalForm.email().value.set($event)"
      />
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="button-row">
      <label class="chip" style="cursor:pointer">
        <input type="checkbox" [checked]="mandatory()"
               (change)="mandatory.set($any($event.target).checked)"
               style="margin-right:6px" />
        Required validator
      </label>
    </div>
<div class="event-grid" style="margin-top:8px">
      <div class="event-row">
        <span class="event-label">Validator</span>
        <span class="event-value">{{ mandatory() ? 'required' : 'optional' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Marker rendered</span>
        <span class="event-value">{{ mandatory() ? 'yes' : 'no' }}</span>
      </div>
    </div>`,
};
