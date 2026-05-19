import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot override: *cngxSelectRetryButton',
  subtitle: 'Swap the visual frame of every Retry / Try again button rendered by the shared panel-shell — load-error, inline refresh-error, and commit-error banner all read from this single override. Context: <code>{ retry, error, disabled, label }</code>.',
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
    'import { CngxSelect, CngxSelectRetryButton, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSelect', 'CngxSelectRetryButton'],
  setup: `protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];
  protected readonly asyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
  protected readonly asyncValue = signal<string | undefined>(undefined);
  protected asyncSetSuccess(): void { this.asyncState.setSuccess(this.asyncOptions); }
  protected asyncSetError(): void { this.asyncState.setError(new Error('Network offline')); }`,
  template: `
  <cngx-select [label]="'Language'" [options]="asyncOptions" [(value)]="asyncValue" [state]="asyncState" placeholder="Choose language…">
    <ng-template cngxSelectRetryButton let-retry let-label="label" let-disabled="disabled">
      <button type="button" class="chip" [disabled]="disabled" (click)="retry()" style="background:color-mix(in oklch, var(--cngx-color-warning) 10%, transparent);border-color:color-mix(in oklch, var(--cngx-color-warning) 35%, transparent);color:var(--cngx-color-warning)">
        ↻ {{ label }}
      </button>
    </ng-template>
  </cngx-select>
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetError()">Trigger load error</button>
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
  </div>`,
};
