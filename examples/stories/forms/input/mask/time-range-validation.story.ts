import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: time range validation',
  subtitle:
    'A time mask checks one character per slot, so it lets <code>25:00</code> or <code>14:30 PM</code> through. Add the <code>time()</code> rule and the field reports <code>timeRange</code>: type an invalid time and leave the field.',
  description:
    'The cycle comes from the value: AM/PM means 1-12, none means 0-23. The pinned masks pass the same cycle to <code>time()</code>; the bare <code>time</code> mask follows the locale and lets the value decide. The message is the <code>timeRange</code> key of the form-field language section, rendered and announced by <code>cngx-field-errors</code>. Flip EN / DE: the locale flips with the language, so the bare field switches between 12 and 24 hours.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxInputMask', 'CngxInput', 'CngxFormField', 'CngxFieldErrors'],
  moduleImports: [
    "import { form, schema, FormField } from '@angular/forms/signals';",
    "import { CngxFieldErrors, CngxFormField, CngxLabel, provideFormFieldI18n, withFormFieldI18nLabels } from '@cngx/forms/field';",
    "import { CngxInput, CngxInputMask } from '@cngx/forms/input';",
    "import { time } from '@cngx/forms/validators';",
    "import { provideLocaleAt } from '@cngx/core/utils';",
    "import { DEMO_FORM_FIELD_LABELS, DEMO_LANG, DEMO_LOCALE } from '../../../../fixtures';",
  ],
  imports: ['FormField', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxInput', 'CngxInputMask'],
  viewProviders: [
    '...provideLocaleAt(DEMO_LOCALE)',
    'provideFormFieldI18n(withFormFieldI18nLabels(DEMO_FORM_FIELD_LABELS))',
  ],
  setup: `protected readonly model = signal({ opens: '', closes: '', pickup: '' });
  protected readonly hours = form(this.model, schema((root) => {
    time(root.opens, { cycle: 12 });
    time(root.closes, { cycle: 24 });
    time(root.pickup);
  }));`,
  template: `
  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="hours.opens">
      <label cngxLabel>Opens (12-hour)</label>
      <input cngxInput cngxInputMask="time:12" [formField]="hours.opens" />
      <cngx-field-errors />
    </cngx-form-field>
    <cngx-form-field [field]="hours.closes">
      <label cngxLabel>Closes (24-hour)</label>
      <input cngxInput cngxInputMask="time:24" [formField]="hours.closes" />
      <cngx-field-errors />
    </cngx-form-field>
    <cngx-form-field [field]="hours.pickup">
      <label cngxLabel>Pickup (locale hour cycle)</label>
      <input #pickup="cngxInputMask" cngxInput cngxInputMask="time" [formField]="hours.pickup" />
      <cngx-field-errors />
    </cngx-form-field>
  </div>`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>
  <div class="status-row">
    <span class="status-badge">Pickup mask: {{ pickup.currentPattern() }}</span>
  </div>`,
};
