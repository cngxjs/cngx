import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi — text summary via *cngxMultiSelectTriggerLabel',
  subtitle: 'Replace the whole chip strip with a plain-text summary by projecting <code>*cngxMultiSelectTriggerLabel</code>. The template context gives you the resolved options, raw values, and count — pick any shape (count badge, comma list, first-label + "+N", …).',
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
    'import { CngxMultiSelect, CngxMultiSelectTriggerLabel, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxMultiSelect', 'CngxMultiSelectTriggerLabel'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];
  protected readonly multiTextValues = signal<string[]>(['angular', 'signals']);`,
  template: `  <cngx-multi-select
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="multiTextValues"
    placeholder="Choose topics…"
  >
    <ng-template cngxMultiSelectTriggerLabel let-opts let-count="count">
      @if (count === 1) {
        {{ opts[0].label }}
      } @else {
        {{ count }} topics selected
      }
    </ng-template>
  </cngx-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiTextValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ multiTextValues().length }}</span></div>
  </div>`,
};
