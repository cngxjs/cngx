import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Inside <cngx-form-field> — Reactive Forms',
  subtitle: '<code>adaptFormControl(control, name)</code> bridges a Reactive-Forms <code>FormControl</code> into the shell\'s Signal-Forms-first <code>[field]</code> contract. Bidirectional sync runs through <code>createFieldSync</code> with <code>compareWith</code>-aware equality.',
  description: 'CngxSelectShell — single-value declarative-options dropdown. Project user-authored <cngx-option> / <cngx-optgroup> children directly; the shell derives a hierarchy-aware option model and runs the same family-level intelligence (createSelectCore, createFieldSync, createScalarCommitHandler, announcer) as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
  ],
  moduleImports: [
    'import { FormControl } from \'@angular/forms\';',
    'import { CngxFormField, CngxLabel, adaptFormControl } from \'@cngx/forms/field\';',
    'import { CngxSelectShell, CngxSelectOption } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxFormField', 'CngxLabel'],
  setup: `private readonly rfDestroyRef = inject(DestroyRef);
  protected readonly rfControl = new FormControl<string | null>('green');
  protected readonly rfField = adaptFormControl(this.rfControl, 'color', this.rfDestroyRef);`,
  template: `
  <cngx-form-field [field]="rfField">
    <label cngxLabel>Color</label>
    <cngx-select-shell>
      <cngx-option [value]="'red'">Red</cngx-option>
      <cngx-option [value]="'green'">Green</cngx-option>
      <cngx-option [value]="'blue'">Blue</cngx-option>
    </cngx-select-shell>
  </cngx-form-field>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">FormControl.value</span>
      <span class="event-value">{{ rfControl.value ?? '—' }}</span>
    </div>
  </div>`,
};
