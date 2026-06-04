import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelectShell: empty state loading flag',
  subtitle: 'Project <code>*cngxSelectEmpty</code> for the no-options state and <code>*cngxSelectPlaceholder</code> for the empty trigger. Toggle <code>[loading]</code> to render the family-shared loading view (spinner / bar / dots / skeleton - configurable via <code>provideSelectConfig(withLoadingVariant(...))</code>).',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelectShell',
    'CngxSelectOption',
  ],
  moduleImports: [
    'import { CngxSelectShell, CngxSelectOption, CngxSelectPlaceholder, CngxSelectEmpty } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectEmpty', 'CngxSelectPlaceholder'],
  setup: `protected readonly emptyValue = signal<string | undefined>(undefined);
  protected readonly loadingFlag = signal(false);`,
  template: `  <cngx-select-shell
    [label]="'Item'"
    [loading]="loadingFlag()"
    [(value)]="emptyValue"
  >
    <ng-template cngxSelectPlaceholder let-ph>
      <em style="opacity:.6">- select an item -</em>
    </ng-template>
    <ng-template cngxSelectEmpty>
      <div class="demo-select-empty-state">
        No options available
      </div>
    </ng-template>
  </cngx-select-shell>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <label>
      <input
        type="checkbox"
        [checked]="loadingFlag()"
        (change)="loadingFlag.set($any($event.target).checked)"
      />
      Loading
    </label>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ emptyValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">tip</span>
      <span class="event-value">No projected options → empty template renders in the panel.</span>
    </div>
  </div>`,
};
