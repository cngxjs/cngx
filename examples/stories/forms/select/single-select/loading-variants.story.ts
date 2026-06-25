import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: loading variants',
  subtitle: '<code>[loadingVariant]</code> picks one of four built-in first-load visuals: <code>spinner</code> (default), <code>skeleton</code> (with configurable <code>[skeletonRowCount]</code>), <code>bar</code>, or <code>text</code>. Globally configurable via <code>provideSelectConfig(withLoadingVariant(\'skeleton\'), withSkeletonRowCount(5))</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
  ],
  moduleImports: [
    'import { CngxSelect, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSelect'],
  setup: `  protected readonly loadingVariantSel = signal<'skeleton' | 'spinner' | 'bar' | 'text'>('spinner');
  protected readonly variantValue = signal<string | undefined>(undefined);
  protected readonly variantState = createManualState<CngxSelectOptionsInput<string>>();`,
  setupChrome: `protected readonly loading = signal(true);
  protected readonly asyncOptions: CngxSelectOptionDef<string>[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ];
  protected triggerVariantLoading(): void { this.variantState.set('loading'); }
  protected triggerVariantSuccess(): void { this.variantState.setSuccess(this.asyncOptions); }`,
  template: `  <cngx-select
    [label]="'Language'"
    [state]="variantState"
    [loadingVariant]="loadingVariantSel()"
    [skeletonRowCount]="5"
    [(value)]="variantValue"
    placeholder="Choose language…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <span class="event-label">Variant</span>
      @for (v of ['spinner','skeleton','bar','text']; track v) {
        <label style="display:inline-flex;align-items:center;gap:4px">
          <input type="radio" name="lv" [value]="v" [checked]="loadingVariantSel() === v" (change)="loadingVariantSel.set($any(v))" /> {{ v }}
        </label>
      }
    </div>
    <div class="event-row" style="gap:8px">
      <button type="button" class="chip" (click)="triggerVariantLoading()">loading</button>
      <button type="button" class="chip" (click)="triggerVariantSuccess()">success</button>
    </div>
  </div>`,
};
