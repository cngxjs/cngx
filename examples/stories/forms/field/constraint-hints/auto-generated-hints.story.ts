import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'withConstraintHints: Auto-generated hints from validators',
  subtitle: 'In an app you wire <code>provideFormField(withConstraintHints())</code> once in <code>bootstrapApplication</code>; the presenter then derives hint strings like <code>3&ndash;12 characters</code> from the field\'s <code>minLength</code> / <code>maxLength</code> / <code>min</code> / <code>max</code> validators. This demo scopes the identical config to the example via <code>CNGX_FORM_FIELD_CONFIG</code> so the rest of the catalogue stays hint-free.',
  description: 'The hints live on <code>CngxFormFieldPresenter.constraintHints()</code> as a plain <code>string[]</code> - nothing renders until a consumer interpolates it, so the skin stays yours. Here a <code>viewChild(CngxFormFieldPresenter)</code> reads the array; in an app a tiny child component that injects <code>CngxFormFieldPresenter</code> does the same without a query (see the <code>withConstraintHints</code> API docs for that pattern). Rendering the joined string inside <code>[cngxHint]</code> wires it into <code>aria-describedby</code>, so a screen reader announces the constraints with the field. Pass custom formatters to <code>withConstraintHints({ ... })</code> for i18n.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'withConstraintHints',
    'CngxFormFieldPresenter',
    'CngxFormField',
    'CngxHint',
  ],
  moduleImports: [
    'import { form, schema, required, minLength, maxLength } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxFormFieldPresenter, CngxLabel, CngxHint, CngxFieldErrors, CNGX_FORM_FIELD_CONFIG, DEFAULT_HINT_FORMATTERS } from \'@cngx/forms/field\';',
    'import { CngxInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxHint', 'CngxFieldErrors'],
  viewProviders: [
    '{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { constraintHints: DEFAULT_HINT_FORMATTERS } }',
  ],
  setup: `protected readonly hintModel = signal({ username: '' });
  protected readonly hintForm = form(this.hintModel, schema<{ username: string }>((root) => {
    required(root.username, { message: 'Username is required' });
    minLength(root.username, 3);
    maxLength(root.username, 12);
  }));
  protected readonly presenter = viewChild(CngxFormFieldPresenter);`,
  template: `  <div class="demo-field" style="max-width:480px">
    <cngx-form-field [field]="hintForm.username">
      <label cngxLabel>Username</label>
      <input cngxInput placeholder="pick a handle" />
      @if (presenter(); as p) {
        @if (p.constraintHints().length) {
          <span cngxHint>{{ p.constraintHints().join(', ') }}</span>
        }
      }
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">constraintHints()</span>
      <span class="event-value">{{ presenter()?.constraintHints()?.join(' + ') || '(none)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ hintForm.username().value() }}</span>
    </div>
  </div>`,
};
