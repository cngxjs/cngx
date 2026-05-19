import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Fixed-width panel (number)',
  subtitle: '<code>[panelWidth]="400"</code> locks the panel\'s min-inline-size to 400px, independent of the trigger width. <code>\'trigger\'</code> (default) matches trigger width via CSS <code>anchor-size()</code>; <code>null</code> lets the panel size to content.',
  description: 'CngxSelect — native-feeling single-select dropdown with template overrides, optgroups, clearable, loading, commit-action, and signal-/reactive-forms bridges.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
    'CngxSelectCheck',
    'CngxSelectCaret',
    'CngxSelectOptgroupTemplate',
    'CngxSelectPlaceholder',
    'CngxSelectEmpty',
    'CngxSelectLoading',
    'CngxSelectLoadingGlyph',
    'CngxSelectRefreshing',
    'CngxSelectCommitError',
    'CngxSelectOptionPending',
    'CngxSelectOptionError',
    'CngxSelectRetryButton',
    'CngxSelectTriggerLabel',
    'CngxSelectOptionLabel',
    'CngxSelectClearButton',
    'provideSelectConfig',
  ],
  moduleImports: [
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { of } from \'rxjs\';',
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly fixedWidthValue = signal<string | undefined>(undefined);`,
  template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="fixedWidthValue"
    placeholder="Pick a color…"
    [panelWidth]="400"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ fixedWidthValue() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Panel</span><span class="event-value">400px — locked independent of trigger</span></div>
  </div>`,
};
