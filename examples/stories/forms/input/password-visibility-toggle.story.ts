import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInput: password visibility toggle',
  subtitle: '<code>CngxPasswordToggle</code> toggles <code>type="password"</code> to <code>type="text"</code>. Expose via <code>#pwd="cngxPasswordToggle"</code> and bind <code>pwd.visible()</code> / <code>pwd.toggle()</code>.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'CngxInput',
    'CngxPasswordToggle',
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
    'import type { CngxFieldSkin } from \'@cngx/forms/field\';',
    'import { form, schema, required, email, minLength, maxLength, FormField } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxHint, CngxFieldErrors, CngxAffixRow, CngxSuffix } from \'@cngx/forms/field\';',
    'import { CngxInput, CngxPasswordToggle } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'CngxPasswordToggle', 'FormField', 'CngxAffixRow', 'CngxSuffix', 'CngxRadioGroup', 'CngxRadio'],
  setup: `private readonly loginModel = signal({ email: '', password: '' });
  private readonly loginSchema = schema<{ email: string; password: string }>(root => {
    required(root.email);
    email(root.email);
    required(root.password);
    minLength(root.password, 8);
    maxLength(root.password, 64);
  });
  protected readonly loginForm = form(this.loginModel, this.loginSchema);
  protected readonly passwordField = this.loginForm.password;
  protected readonly skin = signal<CngxFieldSkin>('outline');`,
  template: `  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="passwordField" [skin]="skin()">
        <label cngxLabel>Password</label>
        <span cngxAffixRow>
          <input cngxInput cngxPasswordToggle #pwd="cngxPasswordToggle" [formField]="passwordField"
            placeholder="At least 8 characters"
          />
          <button type="button" cngxSuffix cngxSuffixInteractive (click)="pwd.toggle()"
            [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'"
          >{{ pwd.visible() ? 'Hide' : 'Show' }}</button>
        </span>
        <span cngxHint>8-64 characters</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    
  </div>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">Visible: {{ pwd.visible() }}</span>
    </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
        <cngx-radio value="bare">Bare</cngx-radio>
      </cngx-radio-group>
    </div>
  </div>`,
};
