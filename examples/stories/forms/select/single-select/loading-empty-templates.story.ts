import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: loading empty templates',
  subtitle: 'Override panel content via <code>*cngxSelectLoading</code> / <code>*cngxSelectEmpty</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectEmpty',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectEmpty, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelect', 'CngxSelectEmpty'],
  setup: `protected readonly loadingOptions: CngxSelectOptionDef<string>[] = [];
  protected readonly loadingValue = signal<string | undefined>(undefined);
  protected readonly loading = signal(true);`,
  setupChrome: `  protected toggleLoading(): void {
    this.loading.update(v => !v);
  }`,
  template: `  <cngx-select
    [label]="'Async'"
    [options]="loadingOptions"
    [(value)]="loadingValue"
    [loading]="loading()"
    placeholder="Nichts geladen…"
  >
    <ng-template cngxSelectEmpty>
      <span style="opacity:.7">No entries - adjust filters.</span>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <button type="button" class="chip" (click)="toggleLoading()">Toggle loading</button>
    </div>
  </div>`,
};
