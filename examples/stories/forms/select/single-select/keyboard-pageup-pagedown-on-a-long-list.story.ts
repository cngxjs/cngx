import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Keyboard: PageUp/PageDown on a long list',
  subtitle: 'Open the panel and press <kbd>PageDown</kbd> / <kbd>PageUp</kbd> to jump 10 rows at a time (clamped at boundaries, skipping disabled rows). Typeahead-while-closed still works — focus the trigger and press a letter to commit without opening.',
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
  setup: `protected readonly manyOptions: CngxSelectOptionDef<number>[] = Array.from(
    { length: 40 },
    (_, i) => ({ value: i + 1, label: 'Item ' + (i + 1) + ' (#' + (i + 1).toString().padStart(2, '0') + ')' })
  );
  protected readonly manyValue = signal<number | undefined>(undefined);`,
  template: `
  <cngx-select
    [label]="'Item'"
    [options]="manyOptions"
    [(value)]="manyValue"
    placeholder="Choose item…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ manyValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Options</span><span class="event-value">40 entries — PageUp/Down jumps 10</span></div>
  </div>`,
};
