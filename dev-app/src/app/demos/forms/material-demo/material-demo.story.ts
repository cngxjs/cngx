import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Material Bridge',
  navLabel: 'Material',
  navCategory: 'field/material',
  description:
    'Use Angular Material inputs inside cngx-form-field via the CngxMatInputBridge directive.',
  apiComponents: ['CngxMatInputBridge'],
  overview:
    '<p><code>CngxMatInputBridge</code> (<code>[cngxFieldBridge]</code>) adapts <code>matInput</code> for use ' +
    'inside <code>cngx-form-field</code>. cngx handles all ARIA coordination, Material provides the input styling.</p>' +
    '<p>Import from <code>@cngx/forms/field/material</code>. Requires <code>@angular/material</code> as peer dependency.</p>' +
    '<p>Ships a Material theme SCSS mixin (<code>form-field-theme.scss</code>) that maps M3/M2 design tokens to CSS custom properties.</p>',
  moduleImports: [
    "import { form, schema, required, FormField } from '@angular/forms/signals';",
    "import { CngxFormField, CngxLabel, CngxFieldErrors } from '@cngx/forms/field';",
    "import { CngxInput } from '@cngx/forms/input';",
    "import { CngxMatInputBridge } from '@cngx/forms/field/material';",
    "import { MatFormField } from '@angular/material/form-field';",
    "import { MatInput } from '@angular/material/input';",
  ],
  setup: `
  private readonly model = signal({ name: '', website: '', notes: '' });
  private readonly matSchema = schema<{ name: string; website: string; notes: string }>(root => {
    required(root.name);
    required(root.website);
  });
  protected readonly matForm = form(this.model, this.matSchema);
  protected readonly nameField = this.matForm.name;
  protected readonly websiteField = this.matForm.website;
  protected readonly notesField = this.matForm.notes;

  protected touchAll(): void {
    this.nameField().markAsTouched();
    this.websiteField().markAsTouched();
  }
  `,
  sections: [
    {
      title: 'matInput inside cngx-form-field',
      subtitle:
        '<code>mat-form-field</code> provides the Material input chrome (outline, underline). ' +
        '<code>cngx-form-field</code> provides the A11y coordination (label linkage, error gating, ARIA). ' +
        'Add <code>cngxFieldBridge</code> on the same element as <code>matInput</code>.',
      imports: [
        'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'FormField',
        'CngxMatInputBridge', 'MatFormField', 'MatInput',
      ],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="nameField">
        <label cngxLabel>Name</label>
        <mat-form-field appearance="outline" style="width:100%">
          <input matInput cngxFieldBridge [formField]="nameField" placeholder="Jane Doe" />
        </mat-form-field>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="websiteField">
        <label cngxLabel>Website</label>
        <mat-form-field appearance="outline" style="width:100%">
          <input matInput cngxFieldBridge [formField]="websiteField" placeholder="https://example.com" />
        </mat-form-field>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <button class="chip" (click)="touchAll()">Touch all fields</button>

    <div class="status-row">
      <span class="status-badge">Name valid: {{ nameField().valid() }}</span>
      <span class="status-badge">Website valid: {{ websiteField().valid() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Mixed: Material + Native',
      subtitle:
        'You can mix <code>matInput</code> (via bridge) and native <code>cngxInput</code> in the same form. ' +
        'Each field independently uses whichever input directive it needs.',
      imports: [
        'CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxInput', 'FormField',
        'CngxMatInputBridge', 'MatFormField', 'MatInput',
      ],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <cngx-form-field [field]="nameField">
        <label cngxLabel>Name (Material)</label>
        <mat-form-field appearance="outline" style="width:100%">
          <input matInput cngxFieldBridge [formField]="nameField" placeholder="Material input" />
        </mat-form-field>
        <cngx-field-errors />
      </cngx-form-field>
    </div>

    <div class="demo-field">
      <cngx-form-field [field]="notesField">
        <label cngxLabel>Notes (Native)</label>
        <textarea cngxInput [formField]="notesField" placeholder="Plain native textarea" rows="3"
          style="resize:vertical"></textarea>
      </cngx-form-field>
    </div>
  </div>`,
    },
  ],
};
