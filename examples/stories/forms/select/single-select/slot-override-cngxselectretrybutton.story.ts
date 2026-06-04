import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: slot override cngxselectretrybutton',
  subtitle: 'Swap the visual frame of every Retry / Try again button rendered by the shared panel-shell - load-error, inline refresh-error, and commit-error banner all read from this single override. Context: <code>{ retry, error, disabled, label }</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectRetryButton',
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
  protected readonly asyncValue = signal<string | undefined>(undefined);`,
  setupChrome: `  protected asyncSetSuccess(): void { this.asyncState.setSuccess(this.asyncOptions); }
  protected asyncSetError(): void { this.asyncState.setError(new Error('Network offline')); }`,
  template: `  <cngx-select [label]="'Language'" [options]="asyncOptions" [(value)]="asyncValue" [state]="asyncState" placeholder="Choose language…">
    <ng-template cngxSelectRetryButton let-retry let-label="label" let-disabled="disabled">
      <button type="button" class="chip demo-select-retry-button--warn" [disabled]="disabled" (click)="retry()">
        ↻ {{ label }}
      </button>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetError()">Trigger load error</button>
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
  </div>`,
};
