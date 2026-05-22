import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldErrors: multiple validators',
  subtitle: 'Stack <code>required</code> and <code>minLength</code> on the same field. CngxFieldErrors renders one paragraph per active error, ordered as Signal Forms reports them. Submit-empty to see <em>required</em>; type one character to see <em>minLength</em>; type six to clear both.',
  description: 'Each validator emits a separate <code>ValidationError</code> with its own <code>kind</code>. CngxFieldErrors iterates over them, so the message list reflects the live state of the field. The touched gate still applies: errors stay hidden until first blur.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldErrors', 'CngxFormField', 'CngxLabel'],
  moduleImports: [
    'import { form, schema, required, minLength } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
  ],
  imports: ['FormsModule', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
    { label: 'WCAG 3.3.3 Error Suggestion', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion.html' },
  ],
  setup: `protected readonly model = signal<{ username: string }>({ username: '' });
  protected readonly profile = form(this.model, schema((root) => {
    required(root.username, { message: 'Username is required.' });
    minLength(root.username, 6, { message: 'At least 6 characters.' });
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="profile.username">
      <label cngxLabel>Username</label>
      <input type="text" [(ngModel)]="profile.username().value" />
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
};
