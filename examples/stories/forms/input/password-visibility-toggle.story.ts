import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Password Visibility Toggle',
  subtitle: '<code>CngxPasswordToggle</code> toggles <code>type="password"</code> to <code>type="text"</code>. Expose via <code>#pwd="cngxPasswordToggle"</code> and bind <code>pwd.visible()</code> / <code>pwd.toggle()</code>.',
  description: 'Smart input directives with ARIA projection, autocomplete inference, password toggle, and character counter.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxInput',
    'CngxPasswordToggle',
    'CngxCharCount',
  ],
  moduleImports: [
    'import { form, schema, required, email, minLength, maxLength, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxHint, CngxFieldErrors } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxPasswordToggle } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'CngxPasswordToggle', 'FormField'],
  setup: `private readonly loginModel = signal({ email: '', password: '' });
  private readonly loginSchema = schema<{ email: string; password: string }>(root => {
    required(root.email);
    email(root.email);
    required(root.password);
    minLength(root.password, 8);
    maxLength(root.password, 64);
  });
  protected readonly loginForm = form(this.loginModel, this.loginSchema);
  protected readonly passwordField = this.loginForm.password;`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="passwordField">
        <label cngxLabel>Password</label>
        <div style="position:relative">
          <input cngxInput cngxPasswordToggle #pwd="cngxPasswordToggle" [formField]="passwordField"
            placeholder="At least 8 characters" style="width:100%;padding-right:60px"
          />
          <button type="button" (click)="pwd.toggle()"
            [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'"
            style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:0.75rem;color:var(--cngx-field-hint-color,#666)"
          >{{ pwd.visible() ? 'Hide' : 'Show' }}</button>
        </div>
        <span cngxHint>8-64 characters</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <div class="status-row">
      <span class="status-badge">Visible: {{ pwd.visible() }}</span>
    </div>
  </div>`,
};
