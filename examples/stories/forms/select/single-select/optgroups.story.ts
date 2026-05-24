import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: optgroups',
  subtitle: 'Grouped options: pass an array mixing <code>CngxSelectOption</code> and <code>CngxSelectOptionGroup</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
  ],
  moduleImports: [
    'import { CngxSelect, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly priorities: CngxSelectOptionsInput<string> = [
    { label: 'Normal', children: [
      { value: 'low', label: 'Niedrig' },
      { value: 'medium', label: 'Mittel' },
    ]},
    { label: 'Kritisch', children: [
      { value: 'high', label: 'Hoch' },
      { value: 'urgent', label: 'Dringend' },
    ]},
  ];
  protected readonly groupedValue = signal<string | undefined>(undefined);`,
  template: `  <cngx-select
    [label]="'Priority'"
    [options]="priorities"
    [(value)]="groupedValue"
    placeholder="Choose priority…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ groupedValue() || '—' }}</span></div>
  </div>`,
};
