import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxError: basic',
  subtitle: 'A <code>&lt;div cngxError&gt;</code> placed inside <code>&lt;cngx-form-field&gt;</code> renders validation errors by hand. The container is always in the DOM. <code>aria-hidden</code> flips to <code>null</code> only when the field is touched and invalid, and <code>role="alert"</code> appears at the same moment so screen readers announce the change. Type into the input, then blur it to surface the error.',
  description: '<code>CngxError</code> is the manual error slot. Pick it when rendering rules are field-specific: icons keyed on error kind, custom layouts, conditional messages, or markup the registry contract does not cover. For automatic resolution from <code>CNGX_ERROR_MESSAGES</code>, reach for <code>&lt;cngx-field-errors&gt;</code> instead. Do not place both in the same form-field.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxError', 'CngxFormField', 'CngxLabel'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
    { label: 'WCAG 4.1.3 Status Messages', href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html' },
  ],
  moduleImports: [
    'import { form, schema, required, minLength } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxError } from \'@cngx/forms/field\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxError'],
  setup: `protected readonly model = signal<{ username: string }>({ username: '' });
  protected readonly userForm = form(this.model, schema((root) => {
    required(root.username, { message: 'Username is required' });
    minLength(root.username, 3, { message: 'At least 3 characters' });
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:420px">
    <cngx-form-field [field]="userForm.username">
      <label cngxLabel for="basic-username">Username</label>
      <input
        id="basic-username"
        type="text"
        [value]="userForm.username().value()"
        (input)="userForm.username().value.set($any($event.target).value)"
        (blur)="userForm.username().markAsTouched()"
        autocomplete="username"
      />
      <div cngxError>
        @for (e of userForm.username().errors(); track e.kind) {
          <p style="margin:4px 0 0">{{ e.message }}</p>
        }
      </div>
    </cngx-form-field>
  </div>`,
};
