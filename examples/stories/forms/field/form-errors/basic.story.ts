import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFormErrors: basic',
  subtitle: '<code>&lt;cngx-form-errors&gt;</code> is the form-level summary listing every invalid field as a focusable link. Each link calls <code>focusBoundControl()</code> on its bound atom, so a screen reader user lands directly on the offending input. The summary stays hidden until the consumer flips <code>[show]</code>. Click <strong>Validate</strong> to mark every required field touched and reveal the summary.',
  description: 'Implements the WCAG 3.3.1 pattern (Error Identification): when a submit is rejected, the failing fields are listed in text at the top of the form, each entry navigates to its bound control.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxFormErrors', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxInput'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
  ],
  moduleImports: [
    "import { form, schema, required, email } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, CngxFormErrors } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxFieldErrors', 'CngxFormErrors'],
  setup: `protected readonly model = signal({ email: '', password: '', displayName: '' });
  protected readonly userForm = form(this.model, schema<{ email: string; password: string; displayName: string }>((root) => {
    required(root.email, { message: 'Email is required' });
    email(root.email);
    required(root.password, { message: 'Password is required' });
    required(root.displayName, { message: 'Display name is required' });
  }));
  protected readonly showErrors = signal(false);`,
  setupChrome: `  protected handleValidate(): void {
    this.userForm.email().markAsTouched();
    this.userForm.password().markAsTouched();
    this.userForm.displayName().markAsTouched();
    this.showErrors.set(true);
  }
  protected handleReset(): void {
    this.model.set({ email: '', password: '', displayName: '' });
    this.showErrors.set(false);
  }`,
  template: `  <div class="demo-form" style="max-width:480px">
    <cngx-form-errors
      [fields]="[userForm.email, userForm.password, userForm.displayName]"
      [show]="showErrors()"
    />

    <div class="demo-field">
      <cngx-form-field [field]="userForm.email">
        <label cngxLabel>Email</label>
        <input cngxInput [formField]="userForm.email" placeholder="max@example.com" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="userForm.password">
        <label cngxLabel>Password</label>
        <input cngxInput [formField]="userForm.password" type="password" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="userForm.displayName">
        <label cngxLabel>Display name</label>
        <input cngxInput [formField]="userForm.displayName" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="button-row">
      <button type="button" class="chip" (click)="handleValidate()">Validate</button>
      <button type="button" class="chip" (click)="handleReset()">Reset</button>
    </div>
<div class="event-grid">
      <div class="event-row">
        <span class="event-label">Form valid</span>
        <span class="event-value">{{ userForm().valid() ? 'yes' : 'no' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Summary visible</span>
        <span class="event-value">{{ showErrors() ? 'yes' : 'no' }}</span>
      </div>
    </div>`,
};
