import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: clearable',
  subtitle: '<code>[clearable]="true"</code> adds a ✕ button when a value is selected.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
  ],
  moduleImports: [
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly clearableValue = signal<string | undefined>('red');`,
  template: `  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="clearableValue"
    [clearable]="true"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ clearableValue() || '—' }}</span></div>
  </div>`,
};
