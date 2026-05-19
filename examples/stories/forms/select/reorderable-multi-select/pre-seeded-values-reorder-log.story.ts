import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Pre-seeded values + reorder log',
  subtitle: 'Component starts with five selected teams. The <code>(reordered)</code> output fires every time a drag or keyboard move settles on a new position, carrying <code>fromIndex</code> / <code>toIndex</code> / the moved <code>option</code>. <code>(selectionChange)</code> fires with the same payload under <code>action: \'reorder\'</code>.',
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
    'import { of } from \'rxjs\';',
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
  protected readonly seededValues = signal<string[]>(['legal', 'finance', 'hr', 'ops', 'eng']);
  protected readonly seededLog = signal<string[]>([]);
  protected readonly handleSeededReorder = (
    evt: { fromIndex?: number; toIndex?: number; values: readonly string[] },
  ) => {
    const from = evt.fromIndex ?? -1;
    const to = evt.toIndex ?? -1;
    const line =
      new Date().toLocaleTimeString() + ' → [' + from + ' → ' + to + '] ' + evt.values.join(', ');
    this.seededLog.update((l) => [...l.slice(-4), line]);
  };`,
  template: `  <cngx-reorderable-multi-select
    [label]="'Escalation order'"
    [options]="recipients"
    [(values)]="seededValues"
    (reordered)="handleSeededReorder($event)"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Order</span>
      <span class="event-value">{{ seededValues().join(' → ') }}</span>
    </div>
    @for (line of seededLog(); track line) {
      <div class="event-row">
        <span class="event-label">reorder</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
};
