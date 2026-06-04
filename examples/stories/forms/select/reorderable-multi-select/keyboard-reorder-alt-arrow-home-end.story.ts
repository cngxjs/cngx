import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReorderableMultiSelect: keyboard reorder alt arrow home end',
  subtitle:
    'Tab into the chip strip, then press <kbd>Alt</kbd>+<kbd>→</kbd> or <kbd>Alt</kbd>+<kbd>←</kbd> to reorder the focused chip. <kbd>Alt</kbd>+<kbd>Home</kbd> / <kbd>End</kbd> jump the chip to the strip extremes. Plain <kbd>←</kbd>/<kbd>→</kbd> keep moving focus without mutating the selection.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxReorderableMultiSelect',
  ],
  moduleImports: [
    "import { CngxReorderableMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
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
  <cngx-reorderable-multi-select
    [label]="'Agenda order'"
    [options]="recipients"
    [(values)]="keyboardValues"
    [reorderAriaLabel]="'Reorder agenda with Alt and arrow keys'"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
   <div class="kbd-hint">
    <strong>Keyboard:</strong>
    <span><kbd>Tab</kbd> into the strip</span>
    <span><kbd>←</kbd><kbd>→</kbd> move focus</span>
    <span><kbd>Alt</kbd>+<kbd>←</kbd><kbd>→</kbd> reorder</span>
    <span><kbd>Alt</kbd>+<kbd>Home</kbd>/<kbd>End</kbd> to extremes</span>
  </div>
    <div class="event-row">
      <span class="event-label">Current order</span>
      <span class="event-value">{{ keyboardValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
  references: [
    { label: 'WAI-ARIA APG: Listbox with rearrangeable options', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/' },
  ],
};
