import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRequired: auto hide on non required',
  subtitle:
    'Two fields with identical templates. The first has a <code>required</code> validator, the second does not. The same <code>&lt;cngx-required /&gt;</code> in each label renders the asterisk on one and stays invisible on the other.',
  description:
    'No <code>*ngIf</code>, no <code>[hidden]</code>, no conditional logic in the consumer template. CngxRequired reads the form-field presenter and gates its own output on the field\'s required signal.',
  level: 'atom',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxRequired', 'CngxLabel', 'CngxFormField'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxRequired } from '@cngx/forms/field';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxRequired', 'FormsModule'],
  setup: `protected readonly model = signal<{ email: string; nickname: string }>({ email: '', nickname: '' });
  protected readonly profileForm = form(this.model, schema((root) => {
    required(root.email, { message: 'Please enter an email' });
  }));`,
  template: `  <div style="display:grid;gap:16px;grid-template-columns:repeat(2, minmax(0, 1fr));max-width:560px">
    <cngx-form-field [field]="profileForm.email">
      <label cngxLabel>Email <cngx-required /></label>
      <input
        type="email"
        [ngModel]="profileForm.email().value()"
        (ngModelChange)="profileForm.email().value.set($event)"
      />
    </cngx-form-field>

    <cngx-form-field [field]="profileForm.nickname">
      <label cngxLabel>Nickname <cngx-required /></label>
      <input
        type="text"
        [ngModel]="profileForm.nickname().value()"
        (ngModelChange)="profileForm.nickname().value.set($event)"
      />
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:8px">
      <div class="event-row">
        <span class="event-label">Email required</span>
        <span class="event-value">{{ profileForm.email().required() ? 'yes' : 'no' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Nickname required</span>
        <span class="event-value">{{ profileForm.nickname().required() ? 'yes' : 'no' }}</span>
      </div>
    </div>`,
};
