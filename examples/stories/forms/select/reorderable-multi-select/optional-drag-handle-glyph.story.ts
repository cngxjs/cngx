import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Optional drag-handle glyph',
  subtitle: 'By default no grip glyph renders — the whole chip is the drag surface and the ✕ button\'s hover state visually divides "drag here" from "remove here". Project a <code>TemplateRef&lt;void&gt;</code> through the <code>[chipDragHandle]</code> input to add a custom glyph back when your design language calls for one. The slot stays <code>aria-hidden="true"</code> — the semantic reorder is owned by the chip wrapper\'s keyboard handler plus <code>CngxReorder</code>.',
  description: 'CngxReorderableMultiSelect — multi-value picker whose selected chips can be reordered via pointer drag and Alt+Arrow keyboard moves. Thin organism on top of createSelectCore + CngxReorder.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxReorderableMultiSelect',
    'CngxReorder',
    'CngxMultiSelectChip',
    'CngxMultiSelectTriggerLabel',
  ],
  moduleImports: [
    'import { CngxReorderableMultiSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxReorderableMultiSelect'],
  setup: `protected readonly recipients: CngxSelectOptionDef<string>[] = [
    { value: 'ops', label: 'Operations' },
    { value: 'eng', label: 'Engineering' },
    { value: 'legal', label: 'Legal' },
    { value: 'finance', label: 'Finance' },
    { value: 'sales', label: 'Sales' },
    { value: 'support', label: 'Customer Support' },
    { value: 'hr', label: 'Human Resources' },
  ];
  protected readonly customHandleValues = signal<string[]>(['ops', 'sales', 'support']);`,
  template: `  <cngx-reorderable-multi-select
    [label]="'Teams'"
    [options]="recipients"
    [(values)]="customHandleValues"
    [chipDragHandle]="customGrip"
  />

  <ng-template #customGrip>
    <span style="
      display:inline-block;
      font-size:.875rem;
      letter-spacing:.1em;
      font-weight:700;
      color:var(--cngx-color-primary);
    ">&equiv;</span>
  </ng-template>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Team order</span>
      <span class="event-value">{{ customHandleValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
};
