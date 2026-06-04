import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: rich option rendering',
  subtitle: 'Project a <code>*cngxSelectOptionLabel</code> template to render icons/badges per option.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOptionLabel',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectOptionLabel, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectOptionLabel'],
  setup: `protected readonly richOptions: CngxSelectOptionDef<string>[] = [
    { value: 'fe', label: 'Frontend', meta: { icon: '🖥️' } },
    { value: 'be', label: 'Backend', meta: { icon: '⚙️' } },
    { value: 'db', label: 'Database', meta: { icon: '💾' } },
    { value: 'ops', label: 'DevOps', meta: { icon: '🚀' } },
  ];
  protected readonly richValue = signal<string | undefined>(undefined);`,
  template: `  <cngx-select
    [label]="'Trade'"
    [options]="richOptions"
    [(value)]="richValue"
    placeholder="Choose trade…"
  >
    <ng-template cngxSelectOptionLabel let-opt>
      <span>{{ opt.meta?.icon }}</span>
      <strong>{{ opt.label }}</strong>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ richValue() || '—' }}</span></div>
  </div>`,
};
