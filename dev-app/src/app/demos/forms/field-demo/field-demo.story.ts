import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Form Field',
  navLabel: 'Form Field',
  navCategory: 'field',
  description:
    'Invisible A11y coordination container for form fields. ' +
    'Strong opinions about ARIA, zero opinions about styling.',
  apiComponents: [
    'CngxFormField',
    'CngxFormFieldPresenter',
    'CngxLabel',
    'CngxHint',
    'CngxError',
    'CngxFieldErrors',
    'CngxRequired',
    'CngxFormErrors',
  ],
  overview:
    '<p><code>cngx-form-field</code> renders as <code>display: contents</code> — it has zero visual footprint. ' +
    'All ARIA coordination (deterministic IDs, <code>aria-describedby</code>, <code>aria-invalid</code>, ' +
    '<code>aria-errormessage</code>, <code>aria-busy</code>, error gating) is handled automatically.</p>' +
    '<p>CSS state classes (<code>.cngx-field--error</code>, <code>.cngx-field--touched</code>, ' +
    '<code>.cngx-field--disabled</code>, etc.) are set on the container, label, and input for easy styling.</p>' +
    '<p>Input directives live in <code>@cngx/forms/input</code>. Material / native / custom controls bridge via <code>[cngxBindField]</code> in <code>@cngx/forms/field</code>.</p>',
  moduleImports: [
    "import { form, schema, required, email, minLength, maxLength, disabled, submit, FormField } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxHint, CngxError, CngxFieldErrors, CngxFormErrors, focusFirstError, adaptFormControl } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
    "import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';",
  ],
  setup: `
  // ── Login form (Sections 1, 2, 4) ────────────────────────
  private readonly model = signal({ email: '', password: '' });
  private readonly loginSchema = schema<{ email: string; password: string }>(root => {
    required(root.email);
    email(root.email);
    required(root.password);
    minLength(root.password, 8);
    maxLength(root.password, 64);
  });
  protected readonly loginForm = form(this.model, this.loginSchema);
  protected readonly emailField = this.loginForm.email;
  protected readonly passwordField = this.loginForm.password;

  protected touchLogin(): void {
    this.emailField().markAsTouched();
    this.passwordField().markAsTouched();
  }

  // ── Manual error form (Section 2) ───────────────────────
  private readonly manualModel = signal({ email: '' });
  private readonly manualSchema = schema<{ email: string }>(root => {
    required(root.email);
    email(root.email);
  });
  protected readonly manualForm = form(this.manualModel, this.manualSchema);
  protected readonly manualEmailField = this.manualForm.email;

  // ── ARIA inspection form (Section 4) ───────────────────
  private readonly ariaModel = signal({ email: '' });
  private readonly ariaSchema = schema<{ email: string }>(root => {
    required(root.email);
    email(root.email);
  });
  protected readonly ariaForm = form(this.ariaModel, this.ariaSchema);
  protected readonly ariaEmailField = this.ariaForm.email;

  // ── Disabled-reasons form (Section 3) ────────────────────
  private readonly disabledModel = signal({ password: '', confirmPassword: '' });
  private readonly disabledSchema = schema<{ password: string; confirmPassword: string }>(root => {
    required(root.password);
    minLength(root.password, 8);
    required(root.confirmPassword);
    disabled(root.confirmPassword, () => !this.disabledModel().password ? 'Enter a password first' : false);
  });
  protected readonly disabledForm = form(this.disabledModel, this.disabledSchema);
  protected readonly disabledPwField = this.disabledForm.password;
  protected readonly confirmField = this.disabledForm.confirmPassword;

  // ── Submit form (Section 5) ──────────────────────────────
  private readonly submitModel = signal({ firstName: '', lastName: '', emailAddr: '' });
  private readonly submitSchema = schema<{ firstName: string; lastName: string; emailAddr: string }>(root => {
    required(root.firstName);
    required(root.lastName);
    required(root.emailAddr);
    email(root.emailAddr);
  });
  protected readonly submitForm = form(this.submitModel, this.submitSchema);
  protected readonly firstNameField = this.submitForm.firstName;
  protected readonly lastNameField = this.submitForm.lastName;
  protected readonly emailAddrField = this.submitForm.emailAddr;
  protected readonly submitted = signal(false);
  protected readonly submitMessage = signal('');

  protected async handleSubmit(): Promise<void> {
    this.submitMessage.set('');
    this.submitted.set(true);
    const success = await submit(this.submitForm, async () => {
      this.submitMessage.set('Form submitted successfully!');
    });
    if (!success) {
      this.submitMessage.set('Validation failed — focus moved to first error.');
      focusFirstError(this.submitForm);
    }
  }

  // ── Reactive Forms adapter (Section 6) ───────────────────
  protected readonly reactiveControl = new FormControl('', [Validators.required, Validators.email]);
  protected readonly reactiveField = adaptFormControl(this.reactiveControl, 'reactiveEmail');
  `,
  sections: [
    {
      title: 'Basic — Label, Input, Hint, Auto Errors',
      subtitle:
        '<code>CngxFieldErrors</code> auto-renders from the <code>CNGX_ERROR_MESSAGES</code> registry. ' +
        'Errors appear after touch. CSS classes toggle automatically for styling.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'FormField'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="emailField">
        <label cngxLabel>E-Mail</label>
        <input cngxInput [formField]="emailField" placeholder="max@example.com" />
        <span cngxHint>Business address</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <div class="demo-field">
      <cngx-form-field [field]="passwordField">
        <label cngxLabel>Password</label>
        <input cngxInput [formField]="passwordField" type="password" placeholder="At least 8 characters" />
        <span cngxHint>8-64 characters</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <button class="chip" (click)="touchLogin()">Touch all fields</button>
    <div class="status-row">
      <span class="status-badge">Email touched: {{ emailField().touched() }}</span>
      <span class="status-badge">Email valid: {{ emailField().valid() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Manual Error Template',
      subtitle:
        'Use <code>[cngxError]</code> for full control over error rendering.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxError', 'FormField'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="manualEmailField">
        <label cngxLabel>E-Mail</label>
        <input cngxInput [formField]="manualEmailField" placeholder="max@example.com" />
        <div cngxError class="demo-errors">
          @for (err of manualEmailField().errors(); track err.kind) {
            <span>{{ err.message ?? err.kind }}</span>
          }
        </div>
      </cngx-form-field>
    </div>
    <button class="chip" (click)="manualEmailField().markAsTouched()">Touch email</button>
  </div>`,
      css: `.demo-errors { font-size: 0.75rem; color: var(--cngx-field-error-color, #d32f2f); display: flex; flex-direction: column; gap: 2px; }`,
    },
    {
      title: 'Disabled Field with Reasons',
      subtitle:
        'Signal Forms <code>disabled()</code> accepts a string reason. Type in the password field to enable confirm.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'FormField'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="disabledPwField">
        <label cngxLabel>Password</label>
        <input cngxInput [formField]="disabledPwField" type="password" placeholder="Type to enable confirm" />
      </cngx-form-field>
    </div>
    <div class="demo-field">
      <cngx-form-field [field]="confirmField">
        <label cngxLabel>Confirm Password</label>
        <input cngxInput [formField]="confirmField" type="password" placeholder="Re-enter password" />
        <span cngxHint>Must match password</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <div class="status-row">
      <span class="status-badge">Disabled: {{ confirmField().disabled() }}</span>
    </div>
    @for (reason of confirmField().disabledReasons(); track $index) {
      <div class="demo-disabled-reason">{{ reason.message }}</div>
    }
  </div>`,
      css: `.demo-disabled-reason { font-size: 0.75rem; color: var(--cngx-field-hint-color, #888); font-style: italic; }`,
    },
    {
      title: 'ARIA Inspection',
      subtitle:
        'Inspect the input in DevTools. Deterministic IDs, ARIA attributes, and CSS classes toggle automatically.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors', 'FormField'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="ariaEmailField">
        <label cngxLabel>Inspect this input</label>
        <input cngxInput [formField]="ariaEmailField" placeholder="Open DevTools, inspect me"
          style="border: 2px dashed var(--cngx-border,#aaa)" />
        <span cngxHint>Check aria-describedby, aria-required, aria-invalid</span>
        <cngx-field-errors />
      </cngx-form-field>
    </div>
  </div>
  <pre class="code-block" style="margin-top:16px"><code>&lt;cngx-form-field class="cngx-field--required cngx-field--error cngx-field--touched"&gt;
  &lt;label class="cngx-label--required cngx-label--error"
         id="cngx-email-label" for="cngx-email-input"&gt;...&lt;/label&gt;
  &lt;input class="cngx-input--error cngx-input--focused"
         id="cngx-email-input"
         aria-describedby="cngx-email-hint cngx-email-error"
         aria-labelledby="cngx-email-label"
         aria-required="true"
         aria-invalid="true"
         aria-errormessage="cngx-email-error" /&gt;
&lt;/cngx-form-field&gt;</code></pre>`,
    },
    {
      title: 'Error Summary + Focus First Error',
      subtitle:
        '<code>CngxFormErrors</code> shows a WCAG 3.3.1 error summary. <code>focusFirstError()</code> jumps to the first invalid field.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxFieldErrors', 'CngxFormErrors', 'FormField'],
      template: `
  <div class="demo-form">
    <cngx-form-errors [fields]="[firstNameField, lastNameField, emailAddrField]" [show]="submitted()" />
    <div class="demo-field">
      <cngx-form-field [field]="firstNameField">
        <label cngxLabel>First Name</label>
        <input cngxInput [formField]="firstNameField" placeholder="Jane" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <div class="demo-field">
      <cngx-form-field [field]="lastNameField">
        <label cngxLabel>Last Name</label>
        <input cngxInput [formField]="lastNameField" placeholder="Doe" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <div class="demo-field">
      <cngx-form-field [field]="emailAddrField">
        <label cngxLabel>E-Mail</label>
        <input cngxInput [formField]="emailAddrField" placeholder="jane@example.com" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <button class="chip" (click)="handleSubmit()">Submit</button>
    @if (submitMessage()) {
      <div class="status-row">
        <span class="status-badge">{{ submitMessage() }}</span>
      </div>
    }
  </div>`,
    },
    {
      title: 'Reactive Forms Adapter',
      subtitle:
        '<code>adaptFormControl()</code> wraps an <code>AbstractControl</code> for use without Signal Forms.',
      imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxFieldErrors', 'ReactiveFormsModule'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="reactiveField">
        <label cngxLabel>E-Mail (Reactive Forms)</label>
        <input cngxInput [formControl]="reactiveControl" placeholder="max@example.com" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
    <button class="chip" (click)="reactiveControl.markAsTouched()">Touch</button>
    <div class="status-row">
      <span class="status-badge">Touched: {{ reactiveControl.touched }}</span>
      <span class="status-badge">Valid: {{ reactiveControl.valid }}</span>
    </div>
  </div>`,
    },
  ],
};
