import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectShell: grouped divider projected hierarchy',
  subtitle: 'Hierarchy preserved through the projection. <code>&lt;cngx-select-divider /&gt;</code> renders a visual separator that ATs ignore (<code>role="presentation"</code>, <code>aria-hidden</code>). Nested <code>&lt;cngx-optgroup&gt;</code> inside another group dev-warns; use <code>CngxTreeSelect</code> for arbitrary tree shapes.',
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
    'import { CngxSelectShell, CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectOptgroup', 'CngxSelectDivider'],
  setup: `protected readonly groupedValue = signal<string | undefined>(undefined);`,
  template: `  <cngx-select-shell [label]="'Priority'" [(value)]="groupedValue" placeholder="Priority…">
    <cngx-optgroup label="Normal">
      <cngx-option [value]="'low'">Niedrig</cngx-option>
      <cngx-option [value]="'medium'">Mittel</cngx-option>
    </cngx-optgroup>
    <cngx-select-divider />
    <cngx-optgroup label="Eskalation">
      <cngx-option [value]="'high'">Hoch</cngx-option>
      <cngx-option [value]="'critical'">Kritisch</cngx-option>
    </cngx-optgroup>
  </cngx-select-shell>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ groupedValue() ?? '—' }}</span>
    </div>
  </div>`,
};
