import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Combobox — basic (tag picker with typeahead filter)',
  subtitle: '<code>&lt;cngx-combobox&gt;</code> — inline <code>&lt;input role="combobox"&gt;</code> next to the chip strip. Typing filters the panel live; Backspace on an empty input removes the trailing chip; panel stays open on each pick (<code>closeOnSelect</code> default <code>false</code>).',
  description: 'CngxCombobox — tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxCombobox',
    'CngxComboboxChip',
    'CngxComboboxTriggerLabel',
  ],
  moduleImports: [
    'import { CngxCombobox, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxCombobox'],
  setup: `protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];
  protected readonly comboValues = signal<string[]>(['angular']);`,
  template: `
  <cngx-combobox
    [label]="'Topics'"
    [options]="tagOptions"
    [(values)]="comboValues"
    placeholder="Search topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Count</span><span class="event-value">{{ comboValues().length }}</span></div>
  </div>`,
};
