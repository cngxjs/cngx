import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Template override: rich trigger label',
  subtitle: '<code>*cngxSelectTriggerLabel</code> replaces the trigger\'s text node with your own markup — ideal for icons + label combos that mirror the option rendering.',
  description: 'CngxSelect — native-feeling single-select dropdown with template overrides, optgroups, clearable, loading, commit-action, and signal-/reactive-forms bridges.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
    'CngxSelectCheck',
    'CngxSelectCaret',
    'CngxSelectOptgroupTemplate',
    'CngxSelectPlaceholder',
    'CngxSelectEmpty',
    'CngxSelectLoading',
    'CngxSelectLoadingGlyph',
    'CngxSelectRefreshing',
    'CngxSelectCommitError',
    'CngxSelectOptionPending',
    'CngxSelectOptionError',
    'CngxSelectRetryButton',
    'CngxSelectTriggerLabel',
    'CngxSelectOptionLabel',
    'CngxSelectClearButton',
    'provideSelectConfig',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectTriggerLabel, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectTriggerLabel'],
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
    <ng-template cngxSelectTriggerLabel let-opt>
      <span>{{ opt?.meta?.icon }}</span>
      <strong>{{ opt?.label }}</strong>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ richValue() || '—' }}</span></div>
  </div>`,
};
