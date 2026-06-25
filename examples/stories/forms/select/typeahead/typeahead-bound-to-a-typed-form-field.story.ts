import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTypeahead: typeahead bound to a typed form field',
  subtitle: 'Wrapped in <code>&lt;cngx-form-field&gt;</code>. The typeahead binds to the <code>Field&lt;T&gt;</code> via <code>createFieldSync</code> - bidirectional sync with the form value, ARIA wiring inherited from the field-presenter.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxTypeahead',
  ],
  moduleImports: [
    'import { form, schema, required } from \'@angular/forms/signals\';',
    'import { CngxFormField } from \'@cngx/forms/field\';',
    'import { CngxTypeahead, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxTypeahead', 'CngxFormField'],
  setup: `protected readonly typeaheadColorOptions: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'orange', label: 'Orange' },
  ];
  protected readonly typeaheadColorModel = signal<string>('');
  protected readonly typeaheadColorField = form(this.typeaheadColorModel, schema<string>((c) => { required(c); }));`,
  template: `  <cngx-form-field [field]="typeaheadColorField">
    <cngx-typeahead
      [label]="'Color'"
      [options]="typeaheadColorOptions"
      [clearable]="true"
      placeholder="Enter a color…"
    />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Field value</span><span class="event-value">{{ typeaheadColorField().value() || '—' }}</span></div>
  </div>`,
};
