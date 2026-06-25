import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectDivider: divider',
  subtitle:
    'A single <code>&lt;cngx-select-divider /&gt;</code> between flat options renders a visual separator that assistive tech ignores (<code>role="presentation"</code>, <code>aria-hidden</code>). Here it sets the destructive action apart from the rest.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelectDivider', 'CngxSelectShell', 'CngxSelectOption'],
  moduleImports: [
    "import { CngxSelectShell, CngxSelectOption, CngxSelectDivider } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectDivider'],
  setup: `protected readonly value = signal<string | undefined>(undefined);`,
  template: `  <cngx-select-shell [label]="'Action'" [(value)]="value" placeholder="Pick an action…">
    <cngx-option [value]="'edit'">Edit</cngx-option>
    <cngx-option [value]="'duplicate'">Duplicate</cngx-option>
    <cngx-select-divider />
    <cngx-option [value]="'delete'">Delete</cngx-option>
  </cngx-select-shell>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ value() ?? '—' }}</span>
    </div>
  </div>`,
};
