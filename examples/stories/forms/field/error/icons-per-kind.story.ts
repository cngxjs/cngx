import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxError: icons per kind',
  subtitle: 'Each validation error gets its own glyph. <code>required</code> renders an asterisk-style icon, <code>minLength</code> renders a ruler, <code>email</code> renders an envelope. The <code>kind</code> string from Signal Forms keys the lookup. This is the case <code>CngxFieldErrors</code> cannot serve from a flat message registry without a custom <code>TemplateRef</code> per kind.',
  description: 'Manual rendering pays off when the visual treatment varies with the error. Inline SVGs ship with <code>aria-hidden="true"</code> so AT only hears the message text, never the icon name. The <code>role="alert"</code> + <code>aria-live="polite"</code> on the container come from <code>CngxError</code> itself, so screen readers announce the message after the next quiet moment.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxError', 'CngxFormField', 'CngxLabel'],
  moduleImports: [
    'import { form, schema, required, minLength, email } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxError } from \'@cngx/forms/field\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxError'],
  setup: `protected readonly model = signal<{ email: string }>({ email: '' });
  protected readonly emailForm = form(this.model, schema((root) => {
    required(root.email, { message: 'Email is required' });
    minLength(root.email, 5, { message: 'At least 5 characters' });
    email(root.email, { message: 'Enter a valid email address' });
  }));
  protected iconFor(kind: string): 'required' | 'length' | 'email' | 'generic' {
    if (kind === 'required') {
      return 'required';
    }
    if (kind === 'minLength' || kind === 'maxLength') {
      return 'length';
    }
    if (kind === 'email') {
      return 'email';
    }
    return 'generic';
  }`,
  template: `  <div style="display:grid;gap:16px;max-width:480px">
    <cngx-form-field [field]="emailForm.email">
      <label cngxLabel for="kind-email">Email address</label>
      <input
        id="kind-email"
        type="email"
        autocomplete="email"
        [value]="emailForm.email().value()"
        (input)="emailForm.email().value.set($any($event.target).value)"
        (blur)="emailForm.email().markAsTouched()"
      />
      <div cngxError style="display:grid;gap:6px;margin-top:6px">
        @for (e of emailForm.email().errors(); track e.kind) {
          <p style="display:flex;align-items:center;gap:8px;margin:0">
            @switch (iconFor(e.kind)) {
              @case ('required') {
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="M8 2v12M3 5l10 6M3 11l10-6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                </svg>
              }
              @case ('length') {
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <rect x="1" y="5" width="14" height="6" stroke="currentColor" stroke-width="1.2" fill="none"/>
                  <path d="M4 5v2M8 5v3M12 5v2" stroke="currentColor" stroke-width="1.2"/>
                </svg>
              }
              @case ('email') {
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <rect x="1.5" y="3.5" width="13" height="9" stroke="currentColor" stroke-width="1.2" fill="none"/>
                  <path d="M1.5 4l6.5 5 6.5-5" stroke="currentColor" stroke-width="1.2" fill="none"/>
                </svg>
              }
              @default {
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2" fill="none"/>
                  <path d="M8 4v5M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              }
            }
            <span>{{ e.message }}</span>
          </p>
        }
      </div>
    </cngx-form-field>
  </div>`,
};
