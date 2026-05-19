import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot override: *cngxSelectLoading',
  subtitle: 'Replace the panel-shell\'s default loading indicator with a consumer-authored body — useful for branded spinners, progress text, or a cancel-and-restart affordance.',
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
    'import { CngxSelect, CngxSelectLoading, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectLoading'],
  setup: `protected readonly loadingOptions: CngxSelectOptionDef<string>[] = [];
  protected readonly loadingValue = signal<string | undefined>(undefined);
  protected readonly loading = signal(true);
  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }`,
  template: `
  <cngx-select [label]="'Language'" [options]="loadingOptions" [(value)]="loadingValue" [loading]="loading()" placeholder="Choose language…">
    <ng-template cngxSelectLoading let-retry="retry">
      <div role="status" aria-live="polite" style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;padding:1rem">
        <span aria-hidden="true" style="font-size:1.5rem">⏳</span>
        <span>Loading available languages…</span>
      </div>
    </ng-template>
  </cngx-select>
  <button type="button" class="chip" (click)="toggleLoading()" style="margin-top:8px">{{ loading() ? 'Stop loading' : 'Start loading' }}</button>`,
};
