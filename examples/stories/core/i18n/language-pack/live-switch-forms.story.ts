import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Language pack: live switch, forms and treetable',
  subtitle:
    'Field, input and treetable copy follow one language <code>Signal</code>: flip EN / DE and the clear button and the expand toggles switch at once, while a shown validation message keeps its text until the field\'s errors change.',
  description:
    'The error-message map, the input aria labels and the treetable labels are fed from computed signals through <code>viewProviders</code>. <code>cngx-field-errors</code> is a polite live region, so a language flip does not re-voice a shown error; type into the field and the next message speaks German. Labels outside live regions switch immediately.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxFieldErrors', 'CngxInputClear', 'CngxTreetable'],
  moduleImports: [
    "import { form, schema, required, minLength, FormField } from '@angular/forms/signals';",
    "import { CngxFieldErrors, CngxFormField, CngxLabel, provideFormFieldAt, withErrorMessages } from '@cngx/forms/field';",
    "import { CngxInput, CngxInputClear, provideInputConfigAt, withInputAriaLabels } from '@cngx/forms/input';",
    "import { CngxTreetable, provideTreetableAt, withTreetableLabels } from '@cngx/data-display/treetable';",
    "import { DEMO_ERROR_MESSAGES, DEMO_INPUT_ARIA_LABELS, DEMO_LANG, DEMO_TREETABLE_LABELS, ORG_TREE } from '../../../../fixtures';",
  ],
  imports: [
    'FormField',
    'CngxFormField',
    'CngxLabel',
    'CngxFieldErrors',
    'CngxInput',
    'CngxInputClear',
    'CngxTreetable',
  ],
  viewProviders: [
    '...provideFormFieldAt(withErrorMessages(DEMO_ERROR_MESSAGES))',
    '...provideInputConfigAt(withInputAriaLabels(DEMO_INPUT_ARIA_LABELS))',
    '...provideTreetableAt(withTreetableLabels(DEMO_TREETABLE_LABELS))',
  ],
  setup: `protected readonly model = signal<{ username: string }>({ username: '' });
  protected readonly profile = form(this.model, schema((root) => {
    required(root.username);
    minLength(root.username, 6);
  }));
  protected readonly orgTree = ORG_TREE;`,
  template: `
  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="profile.username">
      <label cngxLabel>Username</label>
      <input #username cngxInput type="text" [formField]="profile.username" />
      <button type="button" [cngxInputClear]="username"><span aria-hidden="true">×</span></button>
      <cngx-field-errors />
    </cngx-form-field>
  </div>
  <cngx-treetable [tree]="orgTree" />`,
  setupChrome: `protected readonly lang = DEMO_LANG;`,
  templateChrome: `
  <div class="button-row" role="group" aria-label="Demo language">
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">EN</button>
    <button type="button" class="chip" [attr.aria-pressed]="lang() === 'de'" (click)="lang.set('de')">DE</button>
  </div>`,
};
