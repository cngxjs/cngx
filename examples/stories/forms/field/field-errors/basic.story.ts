import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldErrors: basic',
  subtitle: 'Drop <code>&lt;cngx-field-errors /&gt;</code> inside <code>&lt;cngx-form-field&gt;</code> and validation errors render under the input automatically. The touched gate keeps the message hidden until the user has interacted, so a pristine form does not shout. Tab into the field and back out (or click <strong>Validate</strong>) to surface the error; type a character to clear it.',
  description: 'CngxFieldErrors reads from the surrounding CngxFormField presenter. It auto-renders one paragraph per validation error and sets <code>role="alert"</code> + <code>aria-live="polite"</code> only while errors are visible, so screen readers announce them on appearance and stay quiet otherwise.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldErrors', 'CngxFormField', 'CngxLabel'],
  moduleImports: [
    'import { form, schema, required } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
  ],
  setup: `protected readonly model = signal<{ email: string }>({ email: '' });
  protected readonly profile = form(this.model, schema((root) => {
    required(root.email, { message: 'Email is required.' });
  }));`,
  setupChrome: `  protected handleValidate(): void {
    this.profile.email().markAsTouched();
  }
  protected handleReset(): void {
    this.model.set({ email: '' });
  }`,
  template: `  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="profile.email">
      <label cngxLabel>Email</label>
      <input type="email" [(ngModel)]="profile.email().value" />
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:8px;display:flex;gap:8px">
      <button type="button" class="chip" (click)="handleValidate()">Validate (mark touched)</button>
      <button type="button" class="chip" (click)="handleReset()">Reset</button>
    </div>
    <div class="event-grid" style="margin-top:8px">
      <div class="event-row">
        <span class="event-label">Touched</span>
        <span class="event-value">{{ profile.email().touched() ? 'yes' : 'no' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Valid</span>
        <span class="event-value">{{ profile.email().valid() ? 'yes' : 'no' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Errors visible</span>
        <span class="event-value">{{ profile.email().touched() && profile.email().invalid() ? 'shown' : 'hidden' }}</span>
      </div>
    </div>`,
};
