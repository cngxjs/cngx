import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Typeahead — bound to a typed form field',
  subtitle: 'Wrapped in <code>&lt;cngx-form-field&gt;</code>. The typeahead binds to the <code>Field&lt;T&gt;</code> via <code>createFieldSync</code> — bidirectional sync with the form value, ARIA wiring inherited from the field-presenter.',
  description: 'CngxTypeahead — scalar async autocomplete. Single-value input bound to an async option source with typed-form-field, commit-action and slot-override support.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxTypeahead',
    'CngxSelectOptionLabel',
  ],
  moduleImports: [
    'import { form, schema, required } from \'@angular/forms/signals\';',
    'import { CngxFormField } from \'@cngx/forms/field\';',
    'import { CngxTypeahead, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxTypeahead', 'CngxFormField'],
  setup: `protected readonly typeaheadColorOptions: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Rot' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blau' },
    { value: 'yellow', label: 'Gelb' },
    { value: 'orange', label: 'Orange' },
  ];
  protected readonly typeaheadColorModel = signal<string>('');
  protected readonly typeaheadColorField = form(this.typeaheadColorModel, schema<string>((c) => { required(c); }));`,
  template: `  <cngx-form-field [field]="typeaheadColorField">
    <cngx-typeahead
      [label]="'Color'"
      [options]="typeaheadColorOptions"
      [clearable]="true"
      placeholder="Farbe eingeben…"
    />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Field value</span><span class="event-value">{{ typeaheadColorField().value() || '—' }}</span></div>
  </div>`,
};
