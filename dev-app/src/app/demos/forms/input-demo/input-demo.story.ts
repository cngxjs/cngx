import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Input Directives',
  navLabel: 'Input',
  navCategory: 'input',
  description:
    'Smart input directives with ARIA projection, autocomplete inference, password toggle, and character counter.',
  apiComponents: ['CngxInput', 'CngxPasswordToggle', 'CngxCharCount'],
  overview:
    '<p><code>CngxInput</code> projects ARIA attributes onto native inputs, auto-infers ' +
    '<code>autocomplete</code> and <code>spellcheck</code> from field names, and tracks focus/empty state.</p>' +
    '<p><code>CngxPasswordToggle</code> toggles password visibility with correct ARIA labelling.</p>' +
    '<p><code>CngxCharCount</code> shows a live character counter with custom template support.</p>',
  moduleImports: [
    "import { form, schema, required, email, minLength, maxLength, FormField } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxHint, CngxFieldErrors } from '@cngx/forms/field';",
    "import { CngxInput, CngxPasswordToggle, CngxCharCount } from '@cngx/forms/input';",
  ],
  setup: `
  // ── Login form ─────────────────────────────────────────────
  private readonly loginModel = signal({ email: '', password: '' });
  private readonly loginSchema = schema<{ email: string; password: string }>(root => {
    required(root.email);
    email(root.email);
    required(root.password);
    minLength(root.password, 8);
    maxLength(root.password, 64);
  });
  protected readonly loginForm = form(this.loginModel, this.loginSchema);
  protected readonly emailField = this.loginForm.email;
  protected readonly passwordField = this.loginForm.password;

  // ── Bio form ───────────────────────────────────────────────
  private readonly bioModel = signal({ bio: '' });
  private readonly bioSchema = schema<{ bio: string }>(root => {
    required(root.bio);
    minLength(root.bio, 10);
    maxLength(root.bio, 140);
  });
  protected readonly bioForm = form(this.bioModel, this.bioSchema);
  protected readonly bioField = this.bioForm.bio;

  // ── Second bio for custom template ─────────────────────────
  private readonly bio2Model = signal({ bio: '' });
  private readonly bio2Schema = schema<{ bio: string }>(root => {
    maxLength(root.bio, 140);
  });
  protected readonly bio2Form = form(this.bio2Model, this.bio2Schema);
  protected readonly bio2Field = this.bio2Form.bio;
  `,
  sections: [
    {
      title: 'Smart Autocomplete and Spellcheck',
      subtitle:
        '<code>CngxInput</code> auto-infers <code>autocomplete</code> and <code>spellcheck</code> from the field name. ' +
        'A field named <code>email</code> gets <code>autocomplete="email"</code> and <code>spellcheck="false"</code>. ' +
        'A field named <code>password</code> gets <code>autocomplete="current-password"</code>. ' +
        'Override via <code>provideFormField(withAutocompleteMappings({...}), withNoSpellcheck(...))</code>. ' +
        'The inferred values are shown below each input.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'FormField'],
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
    },
    {
      title: 'Password Visibility Toggle',
      subtitle:
        '<code>CngxPasswordToggle</code> toggles <code>type="password"</code> to <code>type="text"</code>. ' +
        'Expose via <code>#pwd="cngxPasswordToggle"</code> and bind <code>pwd.visible()</code> / <code>pwd.toggle()</code>.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'CngxPasswordToggle', 'FormField'],
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
    },
    {
      title: 'Character Counter',
      subtitle:
        '<code>CngxCharCount</code> shows a live counter. Supports <code>[max]</code> input and custom templates.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'CngxCharCount', 'FormField'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="bioField">
        <label cngxLabel>Bio (default)</label>
        <textarea cngxInput [formField]="bioField" placeholder="Tell us about yourself..." rows="3"
          style="resize:vertical"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span cngxHint>10-140 characters</span>
          <cngx-char-count [max]="140" />
        </div>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="bio2Field">
        <label cngxLabel>Bio (custom template)</label>
        <textarea cngxInput [formField]="bio2Field" placeholder="Same field, custom counter..." rows="3"
          style="resize:vertical"></textarea>
        <cngx-char-count [max]="140">
          <ng-template let-current="current" let-remaining="remaining" let-over="over">
            <span [style.color]="over ? 'var(--cngx-field-error-color, #d32f2f)' : 'var(--cngx-field-hint-color, #666)'"
                  style="font-size:0.75rem">
              @if (over) { {{ -remaining! }} characters over limit }
              @else { {{ remaining }} characters remaining }
            </span>
          </ng-template>
        </cngx-char-count>
      </cngx-form-field>
    </div>
  </div>`,
    },
  ],
};
