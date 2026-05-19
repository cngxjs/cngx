import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async state consumer',
  subtitle: '<code>[state]</code> drives the panel via <code>CngxAsyncState</code>: loading → skeleton, success → options, empty → empty template, refreshing → top-bar + options, error → retry panel. Replaces <code>[options]</code> while the state has data.',
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
    'import { CngxSelect, CngxSelectError, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSelect', 'CngxSelectError'],
  setup: `protected readonly loading = signal(true);
  protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];
  protected readonly asyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
  protected readonly asyncValue = signal<string | undefined>(undefined);
  protected asyncReloads = 0;
  protected readonly asyncReload = (): void => {
    this.asyncReloads += 1;
    this.asyncState.set('loading');
    setTimeout(() => this.asyncState.setSuccess(this.asyncOptions), 600);
  };
  protected asyncSetLoading(): void { this.asyncState.set('loading'); }
  protected asyncSetSuccess(): void { this.asyncState.setSuccess(this.asyncOptions); }
  protected asyncSetRefreshing(): void {
    this.asyncState.setSuccess(this.asyncOptions);
    this.asyncState.set('refreshing');
  }
  protected asyncSetError(): void { this.asyncState.setError(new Error('Network offline')); }
  protected asyncSetEmpty(): void { this.asyncState.setSuccess([]); }`,
  template: `
  <cngx-select
    [label]="'Language'"
    [state]="asyncState"
    [retryFn]="asyncReload"
    [(value)]="asyncValue"
    placeholder="Choose language…"
  >
    <ng-template cngxSelectError let-error let-retry="retry">
      <div style="padding:0.5rem 0.75rem;color:var(--cngx-color-danger)">
        Laden fehlgeschlagen: {{ error?.message ?? error }}
      </div>
      <button type="button" class="chip" style="margin:0 0.75rem 0.5rem" (click)="retry()">Erneut laden</button>
    </ng-template>
  </cngx-select>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Status</span><span class="event-value">{{ asyncState.status() }}</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ asyncValue() ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Reload calls</span><span class="event-value">{{ asyncReloads }}</span></div>
    <div class="event-row" style="gap:8px">
      <button type="button" class="chip" (click)="asyncSetLoading()">loading</button>
      <button type="button" class="chip" (click)="asyncSetSuccess()">success</button>
      <button type="button" class="chip" (click)="asyncSetRefreshing()">refreshing</button>
      <button type="button" class="chip" (click)="asyncSetError()">error</button>
      <button type="button" class="chip" (click)="asyncSetEmpty()">empty</button>
    </div>
  </div>`,
};
