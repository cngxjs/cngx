import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Selection indicator variant: radio',
  subtitle: '<code>[selectionIndicatorVariant]="\'radio\'"</code> swaps the panel\'s built-in indicator from the checkmark to <code>cngx-radio-indicator</code> (dot-in-circle). Useful for single-select panels that want a radio-style visual without losing dropdown ergonomics. Set globally via <code>provideSelectConfig(withSelectionIndicatorVariant(\'radio\'))</code>.',
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
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly standaloneValue = signal<string | undefined>(undefined);`,
  template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="standaloneValue"
    placeholder="Pick a color…"
    selectionIndicatorVariant="radio"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Variant</span><span class="event-value">radio — dot-in-circle</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ standaloneValue() || '—' }}</span></div>
  </div>`,
};
