import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectOptgroup: optgroup',
  subtitle:
    'Wrap projected <code>&lt;cngx-option&gt;</code> elements in <code>&lt;cngx-optgroup label="…"&gt;</code> to render a labelled section in the panel. The group header is presentational; each option keeps its own <code>role="option"</code> so AT announces the option, not the group.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelectOptgroup', 'CngxSelectShell', 'CngxSelectOption'],
  moduleImports: [
    "import { CngxSelectShell, CngxSelectOption, CngxSelectOptgroup } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectOptgroup'],
  setup: `protected readonly value = signal<string | undefined>(undefined);`,
  template: `  <cngx-select-shell [label]="'Produce'" [(value)]="value" placeholder="Pick produce…">
    <cngx-optgroup label="Fruit">
      <cngx-option [value]="'apple'">Apple</cngx-option>
      <cngx-option [value]="'pear'">Pear</cngx-option>
    </cngx-optgroup>
    <cngx-optgroup label="Vegetable">
      <cngx-option [value]="'carrot'">Carrot</cngx-option>
      <cngx-option [value]="'pea'">Pea</cngx-option>
    </cngx-optgroup>
  </cngx-select-shell>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ value() ?? '—' }}</span>
    </div>
  </div>`,
};
