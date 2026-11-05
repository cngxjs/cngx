import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: default refreshing variant via withRefreshingVariant',
  subtitle:
    "<code>provideSelectConfigAt(withRefreshingVariant('dots'))</code> sets the subsequent-load indicator for every select in the subtree. This select reads that default - no per-instance <code>[refreshingVariant]</code> - so a <code>refreshing</code> state shows the dots indicator while the options stay visible.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'async-state'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withRefreshingVariant, type CngxSelectOptionDef, type CngxSelectOptionsInput } from '@cngx/forms/select';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxSelect'],
  viewProviders: ["...provideSelectConfigAt(withRefreshingVariant('dots'))"],
  setup: `protected readonly value = signal<string | undefined>(undefined);
  protected readonly state = createManualState<CngxSelectOptionsInput<string>>();`,
  setupChrome: `protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];
  protected triggerSuccess(): void { this.state.setSuccess(this.asyncOptions); }
  protected triggerRefreshing(): void {
    this.state.setSuccess(this.asyncOptions);
    this.state.set('refreshing');
  }`,
  template: `<cngx-select
  [label]="'Language'"
  [state]="state"
  [(value)]="value"
  placeholder="Choose language…"
/>`,
  templateChrome: `<div class="button-row" style="margin-top:12px;gap:8px">
    <button type="button" class="chip" (click)="triggerRefreshing()">refreshing</button>
    <button type="button" class="chip" (click)="triggerSuccess()">success</button>
  </div>`,
};
