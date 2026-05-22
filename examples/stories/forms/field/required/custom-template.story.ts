import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRequired: custom template',
  subtitle:
    'Project a <code>&lt;ng-template&gt;</code> into <code>&lt;cngx-required&gt;</code> to replace the default asterisk with an icon, a badge, or any markup. The auto-hide rule still applies: the template renders only while the field is required.',
  description:
    'The first field uses a small filled-circle SVG, the second uses a styled "required" badge. Both still set <code>aria-hidden="true"</code> on the host, so the visual variant has no effect on what assistive tech announces.',
  level: 'atom',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxRequired', 'CngxLabel', 'CngxFormField'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals'",
    "import { CngxFormField, CngxLabel, CngxRequired } from '@cngx/forms/field'",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxRequired', 'FormsModule'],
  setup: `protected readonly model = signal<{ email: string; phone: string }>({ email: '', phone: '' });
  protected readonly contactForm = form(this.model, schema((root) => {
    required(root.email, { message: 'Please enter an email' });
    required(root.phone, { message: 'Please enter a phone number' });
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:420px">
    <cngx-form-field [field]="contactForm.email">
      <label cngxLabel>
        Email
        <cngx-required>
          <ng-template>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              aria-hidden="true"
              style="display:inline-block;vertical-align:middle"
            >
              <circle cx="4" cy="4" r="4" fill="currentColor" />
            </svg>
          </ng-template>
        </cngx-required>
      </label>
      <input
        type="email"
        [ngModel]="contactForm.email().value()"
        (ngModelChange)="contactForm.email().value.set($event)"
      />
    </cngx-form-field>

    <cngx-form-field [field]="contactForm.phone">
      <label cngxLabel>
        Phone
        <cngx-required>
          <ng-template>
            <span class="required-badge">required</span>
          </ng-template>
        </cngx-required>
      </label>
      <input
        type="tel"
        [ngModel]="contactForm.phone().value()"
        (ngModelChange)="contactForm.phone().value.set($event)"
      />
    </cngx-form-field>
  </div>`,
};
