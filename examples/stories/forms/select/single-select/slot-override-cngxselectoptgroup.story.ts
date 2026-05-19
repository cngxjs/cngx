import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot override: *cngxSelectOptgroup',
  subtitle: 'Re-skin grouped-option labels — render badges, icons, or counts in the optgroup header without touching the option rows themselves. Class name <code>CngxSelectOptgroupTemplate</code> distinguishes this directive from the <code>&lt;cngx-optgroup&gt;</code> element component used in declarative composition.',
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
    'import { CngxSelect, CngxSelectOptgroupTemplate, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectOptgroupTemplate'],
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
  template: `
  <cngx-select [label]="'Priority'" [options]="priorities" [(value)]="groupedValue" placeholder="Choose priority…">
    <ng-template cngxSelectOptgroup let-group>
      <span style="display:inline-flex;align-items:center;gap:0.5rem">
        <span aria-hidden="true" style="font-size:0.75rem;padding:2px 6px;border-radius:999px;background:color-mix(in oklch, var(--cngx-color-text) 8%, transparent);color:var(--cngx-color-text-muted)">{{ group.children?.length ?? 0 }}</span>
        <strong>{{ group.label }}</strong>
      </span>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ groupedValue() || '—' }}</span></div>
  </div>`,
};
