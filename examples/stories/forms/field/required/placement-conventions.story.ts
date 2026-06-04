import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRequired: placement conventions',
  subtitle:
    'CngxRequired is <code>aria-hidden="true"</code>, so for assistive tech the marker is invisible no matter where it sits. The placement choice is purely visual. Recommended placement is inside <code>&lt;label cngxLabel&gt;</code>; outside-label placements stay legal but lose the label association in the visual tab order.',
  description:
    'Required state is announced by the input itself via <code>aria-required="true"</code>, which <code>&lt;cngx-form-field&gt;</code> projects onto the control. The CngxRequired host therefore communicates only to sighted users, which is why the convention is to place it next to the label text.',
  level: 'atom',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxRequired', 'CngxLabel', 'CngxFormField'],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxRequired } from '@cngx/forms/field';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxRequired', 'FormsModule'],
  references: [
    {
      label: 'WCAG 3.3.2 Labels or Instructions',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
    },
    {
      label: 'WAI-ARIA aria-required',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-required',
    },
  ],
  setup: `protected readonly model = signal<{ inside: string; outside: string }>({ inside: '', outside: '' });
  protected readonly placementForm = form(this.model, schema((root) => {
    required(root.inside, { message: 'Please enter a value' });
    required(root.outside, { message: 'Please enter a value' });
  }));`,
  template: `  <div style="display:grid;gap:16px;max-width:420px">
    <!-- Recommended: marker sits inside the label, next to the visible text. -->
    <cngx-form-field [field]="placementForm.inside">
      <label cngxLabel>Inside label <cngx-required /></label>
      <input
        type="text"
        [ngModel]="placementForm.inside().value()"
        (ngModelChange)="placementForm.inside().value.set($event)"
      />
    </cngx-form-field>

    <!-- Legal but discouraged: marker sits outside the label tag.
         Same SR experience (aria-hidden), but the visual coupling is weaker. -->
    <cngx-form-field [field]="placementForm.outside">
      <label cngxLabel>Outside label</label>
      <cngx-required />
      <input
        type="text"
        [ngModel]="placementForm.outside().value()"
        (ngModelChange)="placementForm.outside().value.set($event)"
      />
    </cngx-form-field>
  </div>`,
};
