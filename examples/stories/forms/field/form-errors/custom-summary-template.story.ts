import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFormErrors: custom summary template',
  subtitle: 'Project an <code>&lt;ng-template&gt;</code> into <code>&lt;cngx-form-errors&gt;</code> to take over rendering. The template context exposes <code>errors</code> (also as implicit), <code>count</code>, and each item carries <code>fieldName</code>, <code>message</code>, <code>kind</code>, and <code>focus()</code>. The default <code>&lt;ul&gt;</code> is replaced, the focus contract is preserved.',
  description: 'Use the custom template to fit the summary into a feature visual language (heading + grouped list, banner card, two-column grid) without re-implementing the focus contract.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxFormErrors', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxInput'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, CngxFormErrors, type FormErrorItem } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxFieldErrors', 'CngxFormErrors'],
  setup: `protected readonly model = signal({ username: '', email: '', age: '' });
  protected readonly profileForm = form(this.model, schema<{ username: string; email: string; age: string }>((root) => {
    required(root.username, { message: 'Pick a username' });
    required(root.email, { message: 'Email is required' });
    required(root.age, { message: 'Age is required' });
  }));
  protected readonly showErrors = signal(true);
  protected trackByName(_: number, item: FormErrorItem): string {
    return item.fieldName;
  }`,
  template: `  <div class="demo-form" style="max-width:520px">
    <cngx-form-errors
      [fields]="[profileForm.username, profileForm.email, profileForm.age]"
      [show]="showErrors()"
    >
      <ng-template let-errors="errors" let-count="count">
        <div role="group" aria-labelledby="custom-summary-heading">
          <h3 id="custom-summary-heading" style="margin:0 0 8px">
            {{ count }} {{ count === 1 ? 'issue' : 'issues' }} to fix before saving
          </h3>
          <ol style="margin:0; display:grid; gap:4px">
            @for (err of errors; track trackByName($index, err)) {
              <li>
                <a (click)="err.focus()" (keydown.enter)="err.focus()"
                   tabindex="0" role="link" style="cursor:pointer; text-decoration:underline">
                  Go to <strong>{{ err.fieldName }}</strong>: {{ err.message }}
                </a>
              </li>
            }
          </ol>
        </div>
      </ng-template>
    </cngx-form-errors>

    <div class="demo-field">
      <cngx-form-field [field]="profileForm.username">
        <label cngxLabel>Username</label>
        <input cngxInput />
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="profileForm.email">
        <label cngxLabel>Email</label>
        <input cngxInput />
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="profileForm.age">
        <label cngxLabel>Age</label>
        <input cngxInput />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
  </div>`,
};
