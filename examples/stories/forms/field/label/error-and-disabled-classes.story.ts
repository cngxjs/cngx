import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLabel: Error and disabled classes',
  subtitle: 'The label host flips three classes from the field presenter: <code>cngx-label--required</code>, <code>cngx-label--error</code> (touched AND invalid), and <code>cngx-label--disabled</code>. Toggle the chrome below to drive each state.',
  description: 'Three labels share the same template but bind to three signal-forms fields in different states. <code>cngx-label--required</code> reflects the validator graph, <code>cngx-label--error</code> reflects <code>showError()</code> from the presenter (touched AND invalid by default), and <code>cngx-label--disabled</code> reflects the schema-level <code>disabled()</code> rule. The classes are stable hooks for consumer CSS.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxLabel',
    'CngxFormField',
  ],
  moduleImports: [
    "import { form, schema, required, disabled } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel } from '@cngx/forms/field';",
  ],
  imports: ['CngxFormField', 'CngxLabel'],
  references: [
    { label: 'WCAG 1.3.1 Info and Relationships', href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html' },
    { label: 'WCAG 3.3.2 Labels or Instructions', href: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html' },
  ],
  setup: `protected readonly model = signal<{ valid: string; invalid: string; locked: string }>({
    valid: 'ada@example.com',
    invalid: '',
    locked: 'read-only value',
  });
  protected readonly stateForm = form(this.model, schema((root) => {
    required(root.valid, { message: 'Required.' });
    required(root.invalid, { message: 'Required.' });
    disabled(root.locked, () => this.lockEnabled());
  }));`,
  setupChrome: `  protected readonly lockEnabled = signal(true);
  protected handleValidate(): void {
    this.stateForm.valid().markAsTouched();
    this.stateForm.invalid().markAsTouched();
    this.stateForm.locked().markAsTouched();
  }
  protected handleReset(): void {
    this.model.set({ valid: 'ada@example.com', invalid: '', locked: 'read-only value' });
  }
  protected handleLockToggle(next: boolean): void {
    this.lockEnabled.set(next);
  }`,
  template: `  <div style="display:grid;gap:16px;max-width:360px">
    <cngx-form-field [field]="stateForm.valid">
      <label cngxLabel>Valid field</label>
      <input type="email" [field]="stateForm.valid" />
    </cngx-form-field>

    <cngx-form-field [field]="stateForm.invalid">
      <label cngxLabel>Invalid (touched)</label>
      <input type="email" [field]="stateForm.invalid" />
    </cngx-form-field>

    <cngx-form-field [field]="stateForm.locked">
      <label cngxLabel>Disabled field</label>
      <input type="text" [field]="stateForm.locked" />
    </cngx-form-field>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="chip" (click)="handleValidate()">Validate (mark touched)</button>
      <button type="button" class="chip" (click)="handleReset()">Reset</button>
      <label style="display:inline-flex;align-items:center;gap:4px">
        <input type="checkbox" [checked]="lockEnabled()" (change)="handleLockToggle($any($event.target).checked)" />
        Disabled flag
      </label>
    </div>
    <div class="event-grid" style="margin-top:8px">
      <div class="event-row">
        <span class="event-label">Valid label classes</span>
        <span class="event-value">
          required: {{ stateForm.valid().required() ? 'yes' : 'no' }},
          error: {{ stateForm.valid().touched() && stateForm.valid().invalid() ? 'yes' : 'no' }},
          disabled: {{ stateForm.valid().disabled() ? 'yes' : 'no' }}
        </span>
      </div>
      <div class="event-row">
        <span class="event-label">Invalid label classes</span>
        <span class="event-value">
          required: {{ stateForm.invalid().required() ? 'yes' : 'no' }},
          error: {{ stateForm.invalid().touched() && stateForm.invalid().invalid() ? 'yes' : 'no' }},
          disabled: {{ stateForm.invalid().disabled() ? 'yes' : 'no' }}
        </span>
      </div>
      <div class="event-row">
        <span class="event-label">Locked label classes</span>
        <span class="event-value">
          required: {{ stateForm.locked().required() ? 'yes' : 'no' }},
          error: {{ stateForm.locked().touched() && stateForm.locked().invalid() ? 'yes' : 'no' }},
          disabled: {{ stateForm.locked().disabled() ? 'yes' : 'no' }}
        </span>
      </div>
    </div>`,
};
