import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInput: smart autocomplete and spellcheck',
  subtitle: '<code>CngxInput</code> auto-infers <code>autocomplete</code> and <code>spellcheck</code> from the field name. A field named <code>email</code> gets <code>autocomplete="email"</code> and <code>spellcheck="false"</code>. A field named <code>password</code> gets <code>autocomplete="current-password"</code>. Override via <code>provideFormField(withAutocompleteMappings({...}), withNoSpellcheck(...))</code>. The inferred values are shown below each input.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'CngxInput',
  ],
  moduleImports: [
    'import { form, schema, required, email, minLength, maxLength, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxHint, CngxFieldErrors } from \'@cngx/forms/field\';',
    'import { CngxInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'FormField'],
  setup: `private readonly loginModel = signal({ email: '', password: '' });
  private readonly loginSchema = schema<{ email: string; password: string }>(root => {
    required(root.email);
    email(root.email);
    required(root.password);
    minLength(root.password, 8);
    maxLength(root.password, 64);
  });
  protected readonly loginForm = form(this.loginModel, this.loginSchema);
  protected readonly emailField = this.loginForm.email;
  protected readonly passwordField = this.loginForm.password;`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="emailField">
        <label cngxLabel>E-Mail</label>
        <input cngxInput [formField]="emailField" placeholder="max@example.com" />
        <span cngxHint>autocomplete="email", spellcheck="false" (inferred from field name "email")</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <div class="demo-field">
      <cngx-form-field [field]="passwordField">
        <label cngxLabel>Password</label>
        <input cngxInput [formField]="passwordField" type="password" placeholder="At least 8 characters" />
        <span cngxHint>autocomplete="current-password" (inferred from field name "password")</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
  </div>`,
};
