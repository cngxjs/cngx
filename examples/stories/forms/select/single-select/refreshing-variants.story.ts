import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Refreshing variants',
  subtitle: '<code>[refreshingVariant]</code> controls the subsequent-load indicator when options stay visible: <code>bar</code> (default), <code>spinner</code>, <code>dots</code>, or <code>none</code>. Triggered by <code>state.status() === \'refreshing\'</code>.',
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
    'import { CngxSelect, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { of } from \'rxjs\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];
  protected readonly refreshingVariantSel = signal<'bar' | 'spinner' | 'dots' | 'none'>('bar');
  protected readonly variantValue = signal<string | undefined>(undefined);
  protected readonly variantState = createManualState<CngxSelectOptionsInput<string>>();
  protected triggerVariantSuccess(): void { this.variantState.setSuccess(this.asyncOptions); }
  protected triggerVariantRefreshing(): void {
    this.variantState.setSuccess(this.asyncOptions);
    this.variantState.set('refreshing');
  }`,
  template: `
  <cngx-select
    [label]="'Language'"
    [state]="variantState"
    [refreshingVariant]="refreshingVariantSel()"
    [(value)]="variantValue"
    placeholder="Choose language…"
  />
  <div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <span class="event-label">Variant</span>
      @for (v of ['bar','spinner','dots','none']; track v) {
        <label style="display:inline-flex;align-items:center;gap:4px">
          <input type="radio" name="rv" [value]="v" [checked]="refreshingVariantSel() === v" (change)="refreshingVariantSel.set($any(v))" /> {{ v }}
        </label>
      }
    </div>
    <div class="event-row" style="gap:8px">
      <button type="button" class="chip" (click)="triggerVariantRefreshing()">refreshing</button>
      <button type="button" class="chip" (click)="triggerVariantSuccess()">success</button>
    </div>
  </div>`,
};
