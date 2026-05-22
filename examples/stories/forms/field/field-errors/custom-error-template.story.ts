import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldErrors: custom error template',
  subtitle: 'Project an <code>&lt;ng-template&gt;</code> child to take over per-error rendering while keeping the registry-driven resolution. The template receives <code>message</code>, <code>kind</code>, <code>index</code>, <code>first</code>, <code>last</code>, and the raw <code>error</code> object in its context.',
  description: 'CngxFieldErrors loops over resolved errors; when a child <code>TemplateRef</code> is present it renders that template per error instead of the default <code>&lt;p&gt;{{ message }}&lt;/p&gt;</code>. Use this slot for icons, severity styling, or kind-specific copy, without giving up the auto-resolution and touched gate.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldErrors', 'CngxFormField', 'CngxLabel'],
  moduleImports: [
    'import { form, schema, required, minLength } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors'],
  setup: `protected readonly model = signal<{ password: string }>({ password: '' });
  protected readonly profile = form(this.model, schema((root) => {
    required(root.password, { message: 'Password is required.' });
    minLength(root.password, 8, { message: 'At least 8 characters.' });
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="profile.password">
      <label cngxLabel>Password</label>
      <input type="password" [(ngModel)]="profile.password().value" />
      <cngx-field-errors>
        <ng-template let-message="message" let-kind="kind" let-index="index">
          <p [style.color]="'var(--cngx-color-danger, #b00020)'">
            <strong>[{{ index + 1 }}] {{ kind }}:</strong> {{ message }}
          </p>
        </ng-template>
      </cngx-field-errors>
    </cngx-form-field>
  </div>`,
};
