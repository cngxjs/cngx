import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: slot override cngxselectrefreshing',
  subtitle: 'Replace the default 2px progress bar overlaid on stale options. Override receives <code>previousCount</code> so consumer templates can render context-aware status like <em>"Refreshing 4 items"</em>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectRefreshing',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectRefreshing, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSelect', 'CngxSelectRefreshing'],
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
  protected asyncSetRefreshing(): void {
    this.asyncState.setSuccess(this.asyncOptions);
    this.asyncState.set('refreshing');
  }`,
  template: `  <cngx-select [label]="'Language'" [options]="asyncOptions" [(value)]="asyncValue" [state]="asyncState" placeholder="Choose language…">
    <ng-template cngxSelectRefreshing let-previousCount="previousCount">
      <div role="status" aria-live="polite" class="demo-select-refresh-strip">
        🔄 Refreshing {{ previousCount }} options…
      </div>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
    <button type="button" class="chip" (click)="asyncSetRefreshing()">Trigger refresh</button>
  </div>`,
};
