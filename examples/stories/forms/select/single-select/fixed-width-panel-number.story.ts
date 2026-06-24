import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: fixed width panel number',
  subtitle: '<code>[panelWidth]="400"</code> locks the panel\'s min-inline-size to 400px, independent of the trigger width. <code>\'trigger\'</code> (default) matches trigger width via CSS <code>anchor-size()</code>; <code>null</code> lets the panel size to content.',
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
  protected readonly fixedWidthValue = signal<string | undefined>(undefined);`,
  template: `  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="fixedWidthValue"
    placeholder="Pick a color…"
    [panelWidth]="400"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ fixedWidthValue() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Panel</span><span class="event-value">400px - locked independent of trigger</span></div>
  </div>`,
};
