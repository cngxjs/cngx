import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — drag chips via mouse / touch',
  subtitle: 'Grab the six-dot handle on any chip and drop it elsewhere in the strip. Order is written back into <code>[(values)]</code> — the signal is the single source of truth, everything else derives from it.',
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
  protected readonly basicValues = signal<string[]>(['ops', 'eng', 'legal']);`,
  template: `  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>Open the panel and select 3–5 recipients.</span>
    <span>Drag any chip — anywhere outside the ✕ button.</span>
  </div>

  <cngx-reorderable-multi-select
    [label]="'Broadcast order'"
    [options]="recipients"
    [clearable]="true"
    [(values)]="basicValues"
    placeholder="Choose recipients…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Current order</span>
      <span class="event-value">{{ basicValues().join(' → ') || '—' }}</span>
    </div>
  </div>`,
};
