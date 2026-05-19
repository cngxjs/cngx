import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Autofocus on mount',
  subtitle: '<code>[autofocus]="true"</code> focuses the trigger on first render — evaluated once, later bound changes have no effect (matches native <code>&lt;select autofocus&gt;</code>).',
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
  protected readonly autofocusValue = signal<string | undefined>(undefined);
  protected readonly autofocusVisible = signal(false);
  protected toggleAutofocus(): void { this.autofocusVisible.update(v => !v); }`,
  template: `
  <button type="button" class="chip" (click)="toggleAutofocus()" style="margin-bottom:8px">
    {{ autofocusVisible() ? 'Hide select' : 'Mount select (autofocus)' }}
  </button>
  @if (autofocusVisible()) {
    <cngx-select
      [label]="'Color'"
      [options]="colors"
      [(value)]="autofocusValue"
      [autofocus]="true"
      placeholder="Autofocus…"
    />
  }
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ autofocusValue() ?? '—' }}</span></div>
  </div>`,
};
