import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Loading + empty templates',
  subtitle: 'Override panel content via <code>*cngxSelectLoading</code> / <code>*cngxSelectEmpty</code>.',
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
    'import { CngxSelect, CngxSelectEmpty, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectEmpty'],
  setup: `protected readonly loadingOptions: CngxSelectOptionDef<string>[] = [];
  protected readonly loadingValue = signal<string | undefined>(undefined);
  protected readonly loading = signal(true);
  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }`,
  template: `
  <cngx-select
    [label]="'Async'"
    [options]="loadingOptions"
    [(value)]="loadingValue"
    [loading]="loading()"
    placeholder="Nichts geladen…"
  >
    <ng-template cngxSelectEmpty>
      <span style="opacity:.7">No entries — adjust filters.</span>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <button type="button" class="chip" (click)="toggleLoading()">Toggle loading</button>
    </div>
  </div>`,
};
