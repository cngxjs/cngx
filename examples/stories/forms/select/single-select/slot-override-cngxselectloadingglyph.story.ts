import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot override: *cngxSelectLoadingGlyph',
  subtitle: 'Replace the inner CSS-driven glyph of the spinner / bar / dots loading variants while keeping the shell\'s ARIA wiring (<code>role="status"</code>, <code>aria-live</code>, <code>aria-label</code>). Skeleton variant ignores this slot — its rows are layout, not glyph.',
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
    'import { CngxSelect, CngxSelectLoadingGlyph, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSelect', 'CngxSelectLoadingGlyph'],
  setup: `  protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];
  protected readonly asyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
  protected readonly asyncValue = signal<string | undefined>(undefined);`,
  setupChrome: `protected readonly loading = signal(true);
  protected asyncSetLoading(): void { this.asyncState.set('loading'); }
  protected asyncSetSuccess(): void { this.asyncState.setSuccess(this.asyncOptions); }`,
  template: `  <cngx-select
    [label]="'Language'"
    [options]="asyncOptions"
    [(value)]="asyncValue"
    [state]="asyncState"
    loadingVariant="spinner"
    placeholder="Choose language…"
  >
    <ng-template cngxSelectLoadingGlyph>
      <span aria-hidden="true" style="font-size:1.25rem;display:inline-block;animation:cngx-select-spin 1s linear infinite">⚙</span>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetLoading()">Set loading</button>
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
  </div>`,
};
