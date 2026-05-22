import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLabel: Show-required override',
  subtitle: 'Assume <code>provideFormField(withRequiredMarker())</code> is wired in <code>bootstrapApplication</code>. Every label on a required field then auto-renders the marker. Set <code>[showRequired]="false"</code> on one specific label to suppress it without changing the validator.',
  description: 'Both fields below carry a <code>required()</code> validator. In an app with the global provider feature active, the first label inherits the default and renders the marker; the second sets <code>[showRequired]="false"</code> and suppresses it locally. The field stays required (the projected input still receives <code>aria-required</code>); only the visual indicator is gone. Useful when the required state is communicated by surrounding copy (e.g. "all fields below are required") and the per-label marker adds noise. The bootstrap snippet sits in the source panel as a comment because the demo harness has no <code>providers</code> slot.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxLabel',
    'CngxFormField',
    'provideFormField',
    'withRequiredMarker',
  ],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel } from '@cngx/forms/field';",
  ],
  imports: ['CngxFormField', 'CngxLabel'],
  setup: `// Bootstrap-layer registration (not runnable inline in this demo,
  // since the example component has no providers slot). In your app:
  //
  //   import { provideFormField, withRequiredMarker } from '@cngx/forms/field';
  //
  //   bootstrapApplication(AppComponent, {
  //     providers: [
  //       provideFormField(withRequiredMarker()),       // marker defaults to '*'
  //       // provideFormField(withRequiredMarker('(required)')),
  //     ],
  //   });
  //
  // With the provider active, every <label cngxLabel> on a required field
  // auto-renders the marker. The second label below opts out via
  // [showRequired]="false" while keeping the validator intact.
  protected readonly model = signal<{ name: string; nickname: string }>({ name: '', nickname: '' });
  protected readonly overrideForm = form(this.model, schema((root) => {
    required(root.name, { message: 'Required.' });
    required(root.nickname, { message: 'Required.' });
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="overrideForm.name">
      <label cngxLabel>Name</label>
      <input type="text" [field]="overrideForm.name" />
    </cngx-form-field>

    <cngx-form-field [field]="overrideForm.nickname">
      <label cngxLabel [showRequired]="false">Nickname (still required, marker suppressed)</label>
      <input type="text" [field]="overrideForm.nickname" />
    </cngx-form-field>
  </div>`,
};
