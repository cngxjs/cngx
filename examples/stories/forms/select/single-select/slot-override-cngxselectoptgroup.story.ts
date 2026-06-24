import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: slot override cngxselectoptgroup',
  subtitle: 'Re-skin grouped-option labels - render badges, icons, or counts in the optgroup header without touching the option rows themselves. Class name <code>CngxSelectOptgroupTemplate</code> distinguishes this directive from the <code>&lt;cngx-optgroup&gt;</code> element component used in declarative composition.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOptgroupTemplate',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectOptgroupTemplate, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectOptgroupTemplate'],
  setup: `protected readonly priorities: CngxSelectOptionsInput<string> = [
    { label: 'Normal', children: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
    ]},
    { label: 'Critical', children: [
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ]},
  ];
  protected readonly groupedValue = signal<string | undefined>(undefined);`,
  template: `  <cngx-select [label]="'Priority'" [options]="priorities" [(value)]="groupedValue" placeholder="Choose priority…">
    <ng-template cngxSelectOptgroup let-group>
      <span style="display:inline-flex;align-items:center;gap:0.5rem">
        <span aria-hidden="true" class="demo-select-optgroup-badge">{{ group.children?.length ?? 0 }}</span>
        <strong>{{ group.label }}</strong>
      </span>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ groupedValue() || '—' }}</span></div>
  </div>`,
};
