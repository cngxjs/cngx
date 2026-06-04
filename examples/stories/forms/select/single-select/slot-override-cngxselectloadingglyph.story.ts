import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: slot override cngxselectloadingglyph',
  subtitle: 'Replace the inner CSS-driven glyph of the spinner / bar / dots loading variants while keeping the shell\'s ARIA wiring (<code>role="status"</code>, <code>aria-live</code>, <code>aria-label</code>). Skeleton variant ignores this slot - its rows are layout, not glyph.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectLoadingGlyph',
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
      <span aria-hidden="true" class="demo-select-loading-glyph--inline" style="display:inline-block;animation:cngx-select-spin 1s linear infinite">⚙</span>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="asyncSetLoading()">Set loading</button>
    <button type="button" class="chip" (click)="asyncSetSuccess()">Reset</button>
  </div>`,
};
