import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Keyboard reorder — Ctrl + Arrow / Home / End',
  subtitle: 'Tab into the chip strip, then press <kbd>Ctrl</kbd>+<kbd>→</kbd> or <kbd>Ctrl</kbd>+<kbd>←</kbd> to reorder the focused chip. <kbd>Ctrl</kbd>+<kbd>Home</kbd> / <kbd>End</kbd> jump the chip to the strip extremes. Plain <kbd>←</kbd>/<kbd>→</kbd> keep moving focus without mutating the selection.',
  description: 'CngxReorderableMultiSelect — multi-value picker whose selected chips can be reordered via pointer drag and Ctrl+Arrow keyboard moves. Thin organism on top of createSelectCore + CngxReorder.',
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
  protected readonly keyboardValues = signal<string[]>(['eng', 'legal', 'finance', 'ops']);`,
  template: `
  <div class="kbd-hint">
    <strong>Keyboard:</strong>
    <span><kbd>Tab</kbd> into the strip</span>
    <span><kbd>←</kbd><kbd>→</kbd> move focus</span>
    <span><kbd>Ctrl</kbd>+<kbd>←</kbd><kbd>→</kbd> reorder</span>
    <span><kbd>Ctrl</kbd>+<kbd>Home</kbd>/<kbd>End</kbd> to extremes</span>
  </div>

  <cngx-reorderable-multi-select
    [label]="'Agenda order'"
    [options]="recipients"
    [(values)]="keyboardValues"
    [reorderAriaLabel]="'Reorder agenda with Ctrl and arrow keys'"
  />

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Current order</span>
      <span class="event-value">{{ keyboardValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
};
