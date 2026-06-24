import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectOption: option',
  subtitle:
    'Each <code>&lt;cngx-option [value]="…"&gt;</code> contributes one selectable entry. Its projected content is the display label the trigger echoes when the option is picked; the bound <code>value</code> is what the shell commits.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelectOption', 'CngxSelectShell'],
  moduleImports: [
    "import { CngxSelectShell, CngxSelectOption } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption'],
  setup: `protected readonly value = signal<string | undefined>(undefined);`,
  template: `  <cngx-select-shell [label]="'Size'" [(value)]="value" placeholder="Pick a size…">
    <cngx-option [value]="'sm'">Small</cngx-option>
    <cngx-option [value]="'md'">Medium</cngx-option>
    <cngx-option [value]="'lg'">Large</cngx-option>
    <cngx-option [value]="'xl'">Extra large</cngx-option>
  </cngx-select-shell>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ value() ?? '—' }}</span>
    </div>
  </div>`,
};
