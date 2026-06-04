import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFieldErrors: with registry messages',
  subtitle: 'Move per-validator <code>message</code> strings out of the schema and into a central <code>CNGX_ERROR_MESSAGES</code> registry. CngxFieldErrors looks up each error\'s <code>kind</code> in the map and renders the resolved string; validators no longer carry presentation text. Wire the registry once in <code>bootstrapApplication</code>, then every field across the app inherits the same vocabulary.',
  description: 'The fields below intentionally validate without inline messages. With no registry entry CngxFieldErrors falls back to the raw error <code>kind</code> (e.g. <code>required</code>, <code>minLength</code>) so the lookup gap is visible. Registering messages in the bootstrap layer (see code below) replaces those raw kinds with the localized text. The registry is a plain map keyed by error kind, so app-wide i18n is one provider call.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldErrors', 'CngxFormField', 'CngxLabel'],
  moduleImports: [
    'import { form, schema, required, minLength } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
  ],
  imports: ['FormsModule', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors'],
  references: [
    { label: 'WCAG 3.3.3 Error Suggestion', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion.html' },
  ],
  setup: `// Bootstrap-layer registration (not runnable inline in this demo,
  // since the example component has no providers slot). In your app:
  //
  //   import { provideFormField, withErrorMessages, provideErrorMessages }
  //     from '@cngx/forms/field';
  //
  //   bootstrapApplication(AppComponent, {
  //     providers: [
  //       provideFormField(withErrorMessages({
  //         required: () => 'This field is required.',
  //         minLength: (e: any) => \`At least \${e.minLength} characters.\`,
  //       })),
  //       // or, equivalently, without provideFormField:
  //       // provideErrorMessages({ required: () => 'Required.' }),
  //     ],
  //   });
  //
  // The fields below validate without inline messages, so the demo renders
  // raw \`kind\` strings ('required', 'minLength') until the registry is wired.
  protected readonly model = signal<{ username: string }>({ username: '' });
  protected readonly profile = form(this.model, schema((root) => {
    required(root.username);
    minLength(root.username, 6);
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="profile.username">
      <label cngxLabel>Username</label>
      <input type="text" [(ngModel)]="profile.username().value" />
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
};
