import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi — clearable',
  subtitle: '<code>[clearable]="true"</code> exposes a single ✕ next to the caret that empties the whole selection in one click. The per-chip ✕ on every pill stays independent of this flag.',
  description: 'CngxMultiSelect — multi-value selection with a chip strip trigger. Same async/commit machinery as CngxSelect; multi-specific slot overrides for chip + summary templates.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxMultiSelect',
    'CngxMultiSelectChip',
    'CngxMultiSelectTriggerLabel',
  ],
  moduleImports: [
    'import { CngxMultiSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxMultiSelect'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];
  protected readonly multiClearableValues = signal<string[]>(['angular', 'a11y']);`,
  template: `
  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiClearableValues"
    [clearable]="true"
    placeholder="Choose topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiClearableValues().join(', ') || '—' }}</span></div>
  </div>`,
};
