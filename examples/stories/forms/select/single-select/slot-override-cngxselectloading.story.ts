import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: slot override cngxselectloading',
  subtitle: 'Replace the panel-shell\'s default loading indicator with a consumer-authored body - useful for branded spinners, progress text, or a cancel-and-restart affordance.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectLoading',
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
      <div role="status" aria-live="polite" class="demo-select-loading-slot">
        <span aria-hidden="true" class="demo-select-loading-glyph">⏳</span>
        <span>Loading available languages…</span>
      </div>
    </ng-template>
  </cngx-select>
  <button type="button" class="chip" (click)="toggleLoading()" style="margin-top:8px">{{ loading() ? 'Stop loading' : 'Start loading' }}</button>`,
};
