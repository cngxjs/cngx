import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: optional drag handle glyph',
  subtitle: 'By default no grip glyph renders - the whole chip is the drag surface and the ✕ button\'s hover state visually divides "drag here" from "remove here". Project a <code>TemplateRef&lt;void&gt;</code> through the <code>[chipDragHandle]</code> input to add a custom glyph back when your design language calls for one. The slot stays <code>aria-hidden="true"</code> - the semantic reorder is owned by the chip wrapper\'s keyboard handler plus <code>CngxReorder</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxReorderableMultiSelect',
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
    <span class="demo-grip-glyph">&equiv;</span>
  </ng-template>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Team order</span>
      <span class="event-value">{{ customHandleValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
};
