import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFormErrors: show on submit',
  subtitle: 'The summary stays out of the way during typing and only appears when the submit handler decides the form should be reported. <code>[show]</code> is bound to a local signal that the submit handler sets to <code>true</code> if the form is invalid, otherwise it stays <code>false</code>. Reset wipes the data and hides the summary again.',
  description: 'Defers error reporting to the submit moment - the user is not nagged on every keystroke, but they get an unambiguous summary once they attempt to commit invalid data.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxFormErrors', 'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxInput'],
  references: [
    { label: 'WCAG 3.3.1 Error Identification', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html' },
  ],
  moduleImports: [
    "import { form, schema, required } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors, CngxFormErrors } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxInput', 'CngxFieldErrors', 'CngxFormErrors'],
  setup: `protected readonly model = signal({ firstName: '', lastName: '', city: '' });
  protected readonly addressForm = form(this.model, schema<{ firstName: string; lastName: string; city: string }>((root) => {
    required(root.firstName, { message: 'First name is required' });
    required(root.lastName, { message: 'Last name is required' });
    required(root.city, { message: 'City is required' });
  }));
  protected readonly showErrors = signal(false);
  protected readonly submitCount = signal(0);`,
  setupChrome: `  protected handleSubmit(): void {
    this.submitCount.update((n) => n + 1);
    this.addressForm.firstName().markAsTouched();
    this.addressForm.lastName().markAsTouched();
    this.addressForm.city().markAsTouched();
    this.showErrors.set(this.addressForm().invalid());
  }
  protected handleReset(): void {
    this.model.set({ firstName: '', lastName: '', city: '' });
    this.showErrors.set(false);
    this.submitCount.set(0);
  }`,
  template: `  <div class="demo-form" style="max-width:480px">
    <cngx-form-errors
      [fields]="[addressForm.firstName, addressForm.lastName, addressForm.city]"
      [show]="showErrors()"
    />

    <div class="demo-field">
      <cngx-form-field [field]="addressForm.firstName">
        <label cngxLabel>First name</label>
        <input cngxInput [formField]="addressForm.firstName" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="addressForm.lastName">
        <label cngxLabel>Last name</label>
        <input cngxInput [formField]="addressForm.lastName" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="addressForm.city">
        <label cngxLabel>City</label>
        <input cngxInput [formField]="addressForm.city" />
        <cngx-field-errors />
      </cngx-form-field>
    </div>
  </div>`,
  templateChrome: `<div class="button-row">
      <button type="button" class="chip" (click)="handleSubmit()">Submit</button>
      <button type="button" class="chip" (click)="handleReset()">Reset</button>
    </div>
<div class="event-grid">
      <div class="event-row">
        <span class="event-label">Submit attempts</span>
        <span class="event-value">{{ submitCount() }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Summary visible</span>
        <span class="event-value">{{ showErrors() ? 'yes' : 'no' }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Form valid</span>
        <span class="event-value">{{ addressForm().valid() ? 'yes' : 'no' }}</span>
      </div>
    </div>`,
};
